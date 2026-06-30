"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { fetchEarningsReportByDateRange } from "@/services/api";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import moment from "moment";
import { FaCalendarAlt, FaFilePdf, FaFileExcel, FaArrowLeft, FaTable, FaClock, FaCoins, FaRegCalendarAlt, FaUsers, FaChartBar } from "react-icons/fa";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TableEarningsDto {
  tableId: number;
  tableName: string;
  sessionCount: number;
  totalBaseAmount: number;
  totalAdditionalAmount: number;
  totalEarnings: number;
  totalMinutesPlayed: number;
}

interface DailyEarningsDto {
  date: string;
  sessionCount: number;
  totalEarnings: number;
}

interface BilliardSessionDetailDto {
  sessionId: number;
  tableId: number;
  tableName: string;
  playerName: string;
  startTime: string;
  endTime: string;
  totalTimeInMinutes: number;
  baseAmount: number;
  additionalAmount: number;
  totalAmount: number;
  gameStartedStaffName: string;
  gameEndedStaffName: string;
}

interface BilliardEarningsReportDto {
  fromDate: string;
  toDate: string;
  totalSessions: number;
  totalBaseAmount: number;
  totalAdditionalAmount: number;
  totalEarnings: number;
  totalMinutesPlayed: number;
  averageEarningsPerSession: number;
  tableBreakdown: TableEarningsDto[];
  dailyBreakdown: DailyEarningsDto[];
  sessions: BilliardSessionDetailDto[];
}

export default function EarningsReportPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  // Date range state (default to current month start and today)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of the month
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [report, setReport] = useState<BilliardEarningsReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"tables" | "daily" | "sessions" | "monthly">("tables");

  // Pagination for Sessions Details
  const [sessionPage, setSessionPage] = useState(1);
  const itemsPerPage = 8;

  // Search filter for Sessions
  const [searchPlayer, setSearchPlayer] = useState("");

  // Handle Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const loadReport = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both start and end dates.");
      return;
    }

    try {
      setLoading(true);
      const data = await fetchEarningsReportByDateRange(fromDate, toDate);
      setReport(data);
      setSessionPage(1);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report. Please verify connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format minutes to "Xh Ym"
  const formatPlaytime = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const remainingMins = Math.round(mins % 60);
    if (hrs > 0) {
      return `${hrs}h ${remainingMins}m`;
    }
    return `${remainingMins} mins`;
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return `LKR ${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter sessions by player name
  const filteredSessions = report?.sessions.filter((s) =>
    s.playerName.toLowerCase().includes(searchPlayer.toLowerCase())
  ) || [];

  // Paginated sessions
  const paginatedSessions = filteredSessions.slice(
    (sessionPage - 1) * itemsPerPage,
    sessionPage * itemsPerPage
  );
  const totalSessionPages = Math.ceil(filteredSessions.length / itemsPerPage);

  // Aggregate daily data into monthly earnings for chart
  const monthlyEarnings = React.useMemo(() => {
    if (!report?.dailyBreakdown) return [];
    const map: Record<string, { month: string; totalEarnings: number; sessionCount: number; baseAmount: number; additionalAmount: number }> = {};
    report.dailyBreakdown.forEach((d) => {
      const key = moment(d.date).format("YYYY-MM");
      const label = moment(d.date).format("MMM YYYY");
      if (!map[key]) {
        map[key] = { month: label, totalEarnings: 0, sessionCount: 0, baseAmount: 0, additionalAmount: 0 };
      }
      map[key].totalEarnings += d.totalEarnings;
      map[key].sessionCount += d.sessionCount;
    });
    // Also pull base/additional from sessions grouped by month
    report.sessions.forEach((s) => {
      const key = moment(s.endTime || s.startTime).format("YYYY-MM");
      if (map[key]) {
        map[key].baseAmount += s.baseAmount || 0;
        map[key].additionalAmount += s.additionalAmount || 0;
      }
    });
    return Object.keys(map).sort().map((k) => map[k]);
  }, [report]);

  // Generate Excel (CSV format)
  const exportToExcel = () => {
    if (!report) return;

    let csv = "";
    // Title
    csv += `"TGC Pool Club - Earnings Report"\n`;
    csv += `"Date Range:","${moment(report.fromDate).format("YYYY-MM-DD")} to ${moment(report.toDate).format("YYYY-MM-DD")}"\n\n`;

    // Summary Section
    csv += `"SUMMARY STATISTICS"\n`;
    csv += `"Total Sessions","${report.totalSessions}"\n`;
    csv += `"Total Base Amount","${report.totalBaseAmount}"\n`;
    csv += `"Total Additional Amount","${report.totalAdditionalAmount}"\n`;
    csv += `"Total Earnings","${report.totalEarnings}"\n`;
    csv += `"Total Playtime (Mins)","${report.totalMinutesPlayed}"\n`;
    csv += `"Average Earnings Per Session","${report.averageEarningsPerSession.toFixed(2)}"\n\n`;

    // Table Breakdown Section
    csv += `"TABLE EARNINGS BREAKDOWN"\n`;
    csv += `"Table ID","Table Name","Session Count","Base Amount","Additional Amount","Total Earnings","Playtime (Mins)"\n`;
    report.tableBreakdown.forEach((t) => {
      csv += `${t.tableId},"${t.tableName}",${t.sessionCount},${t.totalBaseAmount},${t.totalAdditionalAmount},${t.totalEarnings},${t.totalMinutesPlayed}\n`;
    });
    csv += `\n`;

    // Daily Breakdown Section
    csv += `"DAILY EARNINGS BREAKDOWN"\n`;
    csv += `"Date","Session Count","Total Earnings"\n`;
    report.dailyBreakdown.forEach((d) => {
      csv += `"${moment(d.date).format("YYYY-MM-DD")}",${d.sessionCount},${d.totalEarnings}\n`;
    });
    csv += `\n`;

    // Sessions Details Section
    csv += `"DETAILED SESSIONS LOG"\n`;
    csv += `"Session ID","Table ID","Table Name","Player Name","Start Time","End Time","Playtime (Mins)","Base Amount","Additional Amount","Total Amount","Started By Staff","Ended By Staff"\n`;
    report.sessions.forEach((s) => {
      csv += `${s.sessionId},${s.tableId},"${s.tableName || ""}","${s.playerName}","${moment(s.startTime).format("YYYY-MM-DD HH:mm")}","${s.endTime ? moment(s.endTime).format("YYYY-MM-DD HH:mm") : ""}",${s.totalTimeInMinutes},${s.baseAmount || 0},${s.additionalAmount || 0},${s.totalAmount || 0},"${s.gameStartedStaffName || ""}","${s.gameEndedStaffName || ""}"\n`;
    });

    // Download CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `TGC_Pool_Club_Earnings_Report_${report.fromDate}_to_${report.toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel report exported successfully!");
  };

  // Generate PDF report
  const exportToPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    let currentY = 15;

    // Header styling
    doc.setFillColor(59, 130, 246); // Blue header banner
    doc.rect(0, 0, 210, 30, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TGC Pool Club - Earnings Report", 15, 20);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    currentY = 40;
    doc.text(`Generated on: ${moment().format("YYYY-MM-DD HH:mm:ss")}`, 15, currentY);
    doc.text(`Report Period: ${moment(report.fromDate).format("LL")} to ${moment(report.toDate).format("LL")}`, 15, currentY + 6);
    currentY += 15;

    // Line separator
    doc.setDrawColor(220, 220, 220);
    doc.line(15, currentY, 195, currentY);
    currentY += 10;

    // Summary Statistics Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Dark Slate
    doc.text("Summary Statistics", 15, currentY);
    currentY += 8;

    // Summary details in 2 columns
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);

    const leftColX = 15;
    const rightColX = 110;

    doc.text(`Total Sessions: ${report.totalSessions}`, leftColX, currentY);
    doc.text(`Total Playtime: ${formatPlaytime(report.totalMinutesPlayed)}`, rightColX, currentY);
    currentY += 8;

    doc.text(`Base Earnings: ${formatCurrency(report.totalBaseAmount)}`, leftColX, currentY);
    doc.text(`Avg. Session Bill: ${formatCurrency(report.averageEarningsPerSession)}`, rightColX, currentY);
    currentY += 8;

    doc.text(`Additional Earnings: ${formatCurrency(report.totalAdditionalAmount)}`, leftColX, currentY);
    currentY += 10;

    // Bold Total Earnings
    doc.setFillColor(243, 244, 246);
    doc.rect(15, currentY - 5, 180, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL EARNINGS: ${formatCurrency(report.totalEarnings)}`, 20, currentY + 2);
    currentY += 15;

    // 1. Table Breakdown Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Table Breakdown", 15, currentY);
    currentY += 8;

    // Draw table header
    doc.setFillColor(229, 231, 235);
    doc.rect(15, currentY - 5, 180, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Table Name", 20, currentY);
    doc.text("Sessions", 70, currentY);
    doc.text("Base Amt", 100, currentY);
    doc.text("Add. Amt", 130, currentY);
    doc.text("Total Rev", 160, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    report.tableBreakdown.forEach((t) => {
      doc.text(t.tableName || `Table ${t.tableId}`, 20, currentY);
      doc.text(t.sessionCount.toString(), 70, currentY);
      doc.text(formatCurrency(t.totalBaseAmount), 100, currentY);
      doc.text(formatCurrency(t.totalAdditionalAmount), 130, currentY);
      doc.text(formatCurrency(t.totalEarnings), 160, currentY);
      currentY += 7;
    });

    currentY += 10;

    // 2. Daily Earnings Breakdown Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Daily Earnings Trend", 15, currentY);
    currentY += 8;

    doc.setFillColor(229, 231, 235);
    doc.rect(15, currentY - 5, 180, 8, "F");
    doc.setFontSize(9);
    doc.text("Date", 20, currentY);
    doc.text("Sessions", 80, currentY);
    doc.text("Total Revenue", 140, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    report.dailyBreakdown.forEach((d) => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(moment(d.date).format("YYYY-MM-DD"), 20, currentY);
      doc.text(d.sessionCount.toString(), 80, currentY);
      doc.text(formatCurrency(d.totalEarnings), 140, currentY);
      currentY += 7;
    });

    // 3. Sessions details list
    doc.addPage();
    currentY = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Session Details Log", 15, currentY);
    currentY += 8;

    doc.setFillColor(229, 231, 235);
    doc.rect(15, currentY - 5, 180, 8, "F");
    doc.setFontSize(8);
    doc.text("ID", 17, currentY);
    doc.text("Player Name", 28, currentY);
    doc.text("Table", 68, currentY);
    doc.text("Playtime", 88, currentY);
    doc.text("Base", 112, currentY);
    doc.text("Add.", 137, currentY);
    doc.text("Total", 162, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    report.sessions.forEach((s) => {
      if (currentY > 280) {
        doc.addPage();
        currentY = 20;
        // Re-header
        doc.setFillColor(229, 231, 235);
        doc.rect(15, currentY - 5, 180, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.text("ID", 17, currentY);
        doc.text("Player Name", 28, currentY);
        doc.text("Table", 68, currentY);
        doc.text("Playtime", 88, currentY);
        doc.text("Base", 112, currentY);
        doc.text("Add.", 137, currentY);
        doc.text("Total", 162, currentY);
        currentY += 8;
        doc.setFont("helvetica", "normal");
      }
      doc.text(s.sessionId.toString(), 17, currentY);
      doc.text(s.playerName.slice(0, 16), 28, currentY);
      doc.text(s.tableName || `Table ${s.tableId}`, 68, currentY);
      doc.text(formatPlaytime(s.totalTimeInMinutes || 0), 88, currentY);
      doc.text(formatCurrency(s.baseAmount || 0), 112, currentY);
      doc.text(formatCurrency(s.additionalAmount || 0), 137, currentY);
      doc.text(formatCurrency(s.totalAmount || 0), 162, currentY);
      currentY += 7;
    });

    doc.save(`TGC_Pool_Club_Earnings_Report_${report.fromDate}_to_${report.toDate}.pdf`);
    toast.success("PDF report exported successfully!");
  };

  // Run on mount to pre-load report
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadReport();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="container mx-auto max-w-6xl space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl bg-white bg-opacity-80 p-4 shadow-lg backdrop-blur-md border border-white border-opacity-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Back to Dashboard"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Earnings Reports
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Analyze revenue breakdowns & export details
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/details")}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
            >
              Past Sessions Log
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="shadow-lg border-white border-opacity-40 bg-white bg-opacity-80 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500" /> Specify Report Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              <div className="w-full space-y-2 md:flex-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">From Date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-white border-gray-200 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="w-full space-y-2 md:flex-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">To Date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-white border-gray-200 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:items-center">
                <Button
                  onClick={loadReport}
                  disabled={loading}
                  className="w-full flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md font-bold px-6 py-2 h-11"
                >
                  {loading ? "Generating..." : "Generate Report"}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={exportToPDF}
                    disabled={!report || loading}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-3 rounded-lg flex items-center justify-center h-11 w-11 shadow-md shrink-0"
                    title="Export PDF"
                  >
                    <FaFilePdf size={18} />
                  </Button>

                  <Button
                    onClick={exportToExcel}
                    disabled={!report || loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-lg flex items-center justify-center h-11 w-11 shadow-md shrink-0"
                    title="Export Excel"
                  >
                    <FaFileExcel size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {report && (
          <>
            {/* Summary Statistics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Total Earnings */}
              <Card className="shadow-md border-opacity-40 border-white bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between text-blue-600">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Revenue</span>
                    <FaCoins className="text-lg" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg md:text-xl font-extrabold text-blue-600 truncate">{formatCurrency(report.totalEarnings)}</div>
                    <p className="text-[10px] text-gray-400 font-medium">All sessions bill total</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Sessions */}
              <Card className="shadow-md border-opacity-40 border-white bg-white">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between text-purple-600">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Sessions Count</span>
                    <FaUsers className="text-lg" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-gray-800">{report.totalSessions}</div>
                    <p className="text-[10px] text-gray-400 font-medium">Recorded games count</p>
                  </div>
                </CardContent>
              </Card>

              {/* Base Amount */}
              <Card className="shadow-md border-opacity-40 border-white bg-white">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between text-indigo-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Base Revenue</span>
                    <FaTable className="text-lg" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate">{formatCurrency(report.totalBaseAmount)}</div>
                    <p className="text-[10px] text-gray-400 font-medium">Initial hourly charges</p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Amount */}
              <Card className="shadow-md border-opacity-40 border-white bg-white">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between text-violet-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Add. Revenue</span>
                    <FaClock className="text-lg" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate">{formatCurrency(report.totalAdditionalAmount)}</div>
                    <p className="text-[10px] text-gray-400 font-medium">Overtime extra minutes</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Minutes Played */}
              <Card className="shadow-md border-opacity-40 border-white bg-white">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Playtime</span>
                    <FaClock className="text-lg" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate">{formatPlaytime(report.totalMinutesPlayed)}</div>
                    <p className="text-[10px] text-gray-400 font-medium">Cumulative play minutes</p>
                  </div>
                </CardContent>
              </Card>

              {/* Average Session Earnings */}
              <Card className="shadow-md border-opacity-40 border-white bg-white">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between text-amber-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Avg Session Rev</span>
                    <FaCoins className="text-lg" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate">{formatCurrency(report.averageEarningsPerSession)}</div>
                    <p className="text-[10px] text-gray-400 font-medium">Average ticket size</p>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Main Tabs Container */}
            <Card className="shadow-lg border-white border-opacity-40 bg-white">
              <CardHeader className="border-b border-gray-100 pb-0">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab("tables")}
                    className={`pb-4 px-4 font-bold text-sm tracking-wide border-b-2 transition-all ${
                      activeTab === "tables"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Table Breakdown
                  </button>
                  <button
                    onClick={() => setActiveTab("daily")}
                    className={`pb-4 px-4 font-bold text-sm tracking-wide border-b-2 transition-all ${
                      activeTab === "daily"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Daily Trend
                  </button>
                  <button
                    onClick={() => setActiveTab("sessions")}
                    className={`pb-4 px-4 font-bold text-sm tracking-wide border-b-2 transition-all ${
                      activeTab === "sessions"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Sessions Log ({filteredSessions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("monthly")}
                    className={`pb-4 px-4 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTab === "monthly"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FaChartBar className="text-base" />
                    Monthly Chart
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                
                {/* 1. Table Breakdown Tab */}
                {activeTab === "tables" && (
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="min-w-[750px] w-full border-collapse text-left text-sm text-gray-500 bg-white">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold">
                        <tr>
                          <th className="px-6 py-3">Table ID</th>
                          <th className="px-6 py-3">Table Name</th>
                          <th className="px-6 py-3 text-center">Sessions Logged</th>
                          <th className="px-6 py-3">Base Amount</th>
                          <th className="px-6 py-3">Additional Amount</th>
                          <th className="px-6 py-3 font-semibold text-blue-600">Total Earnings</th>
                          <th className="px-6 py-3">Playtime Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {report.tableBreakdown.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                              No table breakdown data found.
                            </td>
                          </tr>
                        ) : (
                          report.tableBreakdown.map((t) => (
                            <tr key={t.tableId} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900">#{t.tableId}</td>
                              <td className="px-6 py-4 font-semibold text-gray-800">
                                {t.tableName || `Table ${t.tableId}`}
                              </td>
                              <td className="px-6 py-4 text-center font-medium text-gray-700">{t.sessionCount}</td>
                              <td className="px-6 py-4">{formatCurrency(t.totalBaseAmount)}</td>
                              <td className="px-6 py-4">{formatCurrency(t.totalAdditionalAmount)}</td>
                              <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(t.totalEarnings)}</td>
                              <td className="px-6 py-4 font-medium">{formatPlaytime(t.totalMinutesPlayed)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. Daily Breakdown Tab */}
                {activeTab === "daily" && (
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="min-w-[450px] w-full border-collapse text-left text-sm text-gray-500 bg-white">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3 text-center">Sessions count</th>
                          <th className="px-6 py-3 font-semibold text-blue-600">Total Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {report.dailyBreakdown.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-gray-400">
                              No daily breakdown data found.
                            </td>
                          </tr>
                        ) : (
                          report.dailyBreakdown.map((d) => (
                            <tr key={d.date} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-800 flex items-center gap-2">
                                <FaRegCalendarAlt className="text-gray-400" />
                                {moment(d.date).format("LL")}
                              </td>
                              <td className="px-6 py-4 text-center font-medium text-gray-700">{d.sessionCount}</td>
                              <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(d.totalEarnings)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. Sessions Log Tab */}
                {activeTab === "sessions" && (
                  <div className="space-y-4">
                    {/* Search Field */}
                    <div className="max-w-xs">
                      <Input
                        placeholder="Search player name..."
                        value={searchPlayer}
                        onChange={(e) => {
                          setSearchPlayer(e.target.value);
                          setSessionPage(1);
                        }}
                        className="bg-white border-gray-200 text-sm"
                      />
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="min-w-[950px] w-full border-collapse text-left text-sm text-gray-500 bg-white">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold">
                          <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Table</th>
                            <th className="px-4 py-3">Player</th>
                            <th className="px-4 py-3">Start Time</th>
                            <th className="px-4 py-3">End Time</th>
                            <th className="px-4 py-3 text-center">Duration</th>
                            <th className="px-4 py-3">Base</th>
                            <th className="px-4 py-3">Additional</th>
                            <th className="px-4 py-3 font-semibold text-blue-600">Total</th>
                            <th className="px-4 py-3">Staff (Start / End)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedSessions.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                                No sessions logged within this date range.
                              </td>
                            </tr>
                          ) : (
                            paginatedSessions.map((s) => (
                              <tr key={s.sessionId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-bold text-gray-900">#{s.sessionId}</td>
                                <td className="px-4 py-3 font-semibold text-gray-800">
                                  {s.tableName || `Table ${s.tableId}`}
                                </td>
                                <td className="px-4 py-3 text-gray-800 font-medium">{s.playerName}</td>
                                <td className="px-4 py-3 text-xs text-gray-600">
                                  {moment(s.startTime).format("YYYY-MM-DD HH:mm")}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">
                                  {s.endTime ? moment(s.endTime).format("YYYY-MM-DD HH:mm") : "-"}
                                </td>
                                <td className="px-4 py-3 text-center font-medium text-gray-700">
                                  {formatPlaytime(s.totalTimeInMinutes || 0)}
                                </td>
                                <td className="px-4 py-3 text-xs">{formatCurrency(s.baseAmount || 0)}</td>
                                <td className="px-4 py-3 text-xs">{formatCurrency(s.additionalAmount || 0)}</td>
                                <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(s.totalAmount || 0)}</td>
                                <td className="px-4 py-3 text-xs text-gray-600">
                                  {s.gameStartedStaffName || "-"} / {s.gameEndedStaffName || "-"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalSessionPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                        <div className="text-xs text-gray-500 font-medium">
                          Showing {(sessionPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(sessionPage * itemsPerPage, filteredSessions.length)} of{" "}
                          {filteredSessions.length} sessions
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            disabled={sessionPage === 1}
                            onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                            className="text-xs py-1 px-3"
                          >
                            Previous
                          </Button>
                          <span className="text-xs font-semibold text-gray-700 px-2">
                            Page {sessionPage} of {totalSessionPages}
                          </span>
                          <Button
                            variant="outline"
                            disabled={sessionPage === totalSessionPages}
                            onClick={() => setSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                            className="text-xs py-1 px-3"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
                {/* 4. Monthly Chart Tab */}
                {activeTab === "monthly" && (
                  <div className="space-y-6">
                    {monthlyEarnings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <FaChartBar className="text-4xl mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No data available for the selected date range.</p>
                        <p className="text-xs mt-1">Try extending the date range to cover multiple months.</p>
                      </div>
                    ) : (
                      <>
                        {/* Bar Chart – Total Revenue per Month */}
                        <div>
                          <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                            Total Revenue — Monthly Bar Chart
                          </h3>
                          <p className="text-xs text-gray-400 mb-4">Hover over a bar to see the exact LKR amount for that month.</p>
                          <div className="w-full h-72 sm:h-96">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={monthlyEarnings}
                                margin={{ top: 30, right: 20, left: 10, bottom: 5 }}
                                barCategoryGap="35%"
                              >
                                <defs>
                                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.85} />
                                  </linearGradient>
                                  <linearGradient id="barGradientPeak" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.9} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                <XAxis
                                  dataKey="month"
                                  tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v) => `LKR ${(v / 1000).toFixed(0)}k`}
                                  width={72}
                                />
                                <Tooltip
                                  cursor={{ fill: "rgba(99,102,241,0.07)", radius: 6 }}
                                  formatter={(value) => [formatCurrency(Number(value ?? 0)), "Total Revenue"]}
                                  labelStyle={{ fontWeight: "bold", color: "#374151", marginBottom: 4 }}
                                  contentStyle={{
                                    borderRadius: "12px",
                                    border: "none",
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                                    fontSize: 13,
                                    padding: "10px 16px",
                                  }}
                                />
                                <Bar
                                  dataKey="totalEarnings"
                                  radius={[6, 6, 0, 0]}
                                  fill="url(#barGradient)"
                                  label={false}
                                  isAnimationActive={true}
                                >
                                  {monthlyEarnings.map((entry, index) => {
                                    const maxVal = Math.max(...monthlyEarnings.map((m) => m.totalEarnings));
                                    return (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.totalEarnings === maxVal ? "url(#barGradientPeak)" : "url(#barGradient)"}
                                      />
                                    );
                                  })}
                                  <LabelList
                                    dataKey="totalEarnings"
                                    position="top"
                                    style={{ fontSize: 10, fill: "#6366f1", fontWeight: 700 }}
                                    formatter={(v: unknown) => {
                                      const n = Number(v ?? 0);
                                      return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
                                    }}
                                  />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Bar Chart – Base vs Additional Breakdown */}
                        <div>
                          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
                            Base vs Additional Revenue Breakdown
                          </h3>
                          <div className="w-full h-64 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={monthlyEarnings} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis
                                  dataKey="month"
                                  tick={{ fontSize: 11, fill: "#6b7280" }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 10, fill: "#6b7280" }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v) => `LKR ${(v / 1000).toFixed(0)}k`}
                                  width={70}
                                />
                                <Tooltip
                                  formatter={(value, name) => [
                                    formatCurrency(Number(value ?? 0)),
                                    name === "baseAmount" ? "Base Revenue" : "Additional Revenue",
                                  ]}
                                  labelStyle={{ fontWeight: "bold", color: "#374151" }}
                                  contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: 12 }}
                                />
                                <Legend
                                  formatter={(value) => (value === "baseAmount" ? "Base Revenue" : "Additional Revenue")}
                                  iconType="circle"
                                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                                />
                                <Bar dataKey="baseAmount" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="additionalAmount" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Monthly Summary Table */}
                        <div>
                          <h3 className="text-sm font-bold text-gray-700 mb-3">Monthly Summary</h3>
                          <div className="overflow-x-auto rounded-lg border border-gray-100">
                            <table className="min-w-[500px] w-full border-collapse text-left text-sm text-gray-600 bg-white">
                              <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold">
                                <tr>
                                  <th className="px-5 py-3">Month</th>
                                  <th className="px-5 py-3 text-center">Sessions</th>
                                  <th className="px-5 py-3">Base Revenue</th>
                                  <th className="px-5 py-3">Additional Revenue</th>
                                  <th className="px-5 py-3 font-semibold text-purple-600">Total Earnings</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {monthlyEarnings.map((m) => (
                                  <tr key={m.month} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 font-semibold text-gray-800">{m.month}</td>
                                    <td className="px-5 py-3 text-center font-medium text-gray-700">{m.sessionCount}</td>
                                    <td className="px-5 py-3">{formatCurrency(m.baseAmount)}</td>
                                    <td className="px-5 py-3">{formatCurrency(m.additionalAmount)}</td>
                                    <td className="px-5 py-3 font-bold text-gray-900">{formatCurrency(m.totalEarnings)}</td>
                                  </tr>
                                ))}
                                <tr className="bg-purple-50 font-bold">
                                  <td className="px-5 py-3 text-purple-700">Total</td>
                                  <td className="px-5 py-3 text-center text-purple-700">{monthlyEarnings.reduce((a, m) => a + m.sessionCount, 0)}</td>
                                  <td className="px-5 py-3 text-purple-700">{formatCurrency(monthlyEarnings.reduce((a, m) => a + m.baseAmount, 0))}</td>
                                  <td className="px-5 py-3 text-purple-700">{formatCurrency(monthlyEarnings.reduce((a, m) => a + m.additionalAmount, 0))}</td>
                                  <td className="px-5 py-3 text-purple-700">{formatCurrency(monthlyEarnings.reduce((a, m) => a + m.totalEarnings, 0))}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}
