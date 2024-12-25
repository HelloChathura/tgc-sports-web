"use client"

import React, { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const DataGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  // const [selectedRows, setSelectedRows] = useState<number[]>([]);


  const employeeData = [
    {
      id: 1,
      name: "John Anderson",
      location: "New York",
      status: "Active",
      trustworthiness: 85,
      rating: 4.5,
      softwareProgress: 75
    },
    {
      id: 2,
      name: "Sarah Miller",
      location: "London",
      status: "Away",
      trustworthiness: 92,
      rating: 4.8,
      softwareProgress: 90
    },
    {
      id: 3,
      name: "Michael Chen",
      location: "Singapore",
      status: "Inactive",
      trustworthiness: 78,
      rating: 4.2,
      softwareProgress: 60
    },
    {
      id: 4,
      name: "Emma Watson",
      location: "Paris",
      status: "Active",
      trustworthiness: 88,
      rating: 4.6,
      softwareProgress: 85
    },
    {
      id: 5,
      name: "David Kim",
      location: "Seoul",
      status: "Active",
      trustworthiness: 95,
      rating: 4.9,
      softwareProgress: 95
    }
    ,
    {
      id: 6,
      name: "David Kim",
      location: "Seoul",
      status: "Active",
      trustworthiness: 95,
      rating: 4.9,
      softwareProgress: 95
    }
    ,
    {
      id: 7,
      name: "David Kim",
      location: "Seoul",
      status: "Active",
      trustworthiness: 95,
      rating: 4.9,
      softwareProgress: 95
    }
    ,
    {
      id: 8,
      name: "David Kim",
      location: "Seoul",
      status: "Active",
      trustworthiness: 95,
      rating: 4.9,
      softwareProgress: 95
    }
    ,
    {
      id: 9,
      name: "David Kim",
      location: "Seoul",
      status: "Active",
      trustworthiness: 95,
      rating: 4.9,
      softwareProgress: 95
    }
    ,
    {
      id: 10,
      name: "David Kim",
      location: "Seoul",
      status: "Active",
      trustworthiness: 95,
      rating: 4.9,
      softwareProgress: 95
    }
    ,
    {
      id: 11,
      name: "David Kim",
      location: "Seoul",
      status: "Active",
      trustworthiness: 95,
      rating: 4.9,
      softwareProgress: 95
    },{
        id: 12,
        name: "David Kim",
        location: "Seoul",
        status: "Active",
        trustworthiness: 95,
        rating: 4.9,
        softwareProgress: 95
      }
  ];

  const itemsPerPage = 5;
  const totalPages = Math.ceil(employeeData.length / itemsPerPage);

  const handlePageChange = (page:number) => {
    setCurrentPage(page);
  };

  // const handleCheckboxChange = (id: number) => {
  //   setSelectedRows((prev) =>
  //     prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
  //   );
  // };

  // const handleSelectAll = () => {
  //   if (selectedRows.length === employeeData.length) {
  //     setSelectedRows([]);
  //   } else {
  //     setSelectedRows(employeeData.map((employee) => employee.id));
  //   }
  // };

  const getStatusColor = (status:string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "away":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = employeeData.slice(startIndex, endIndex);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-7xl mx-auto">
      <div className="overflow-x-auto">
        <table className="min-w-full" role="grid" aria-label="Employee Details">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trustworthiness</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((employee) => (
              <tr
                key={employee.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                    {employee.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.trustworthiness}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.rating}/5.0</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
  style={{ width: `${employee.softwareProgress}%` }}
  role="progressbar"
  aria-valuenow={employee.softwareProgress}
  aria-valuemin={0} // Changed to a number
  aria-valuemax={100} // Changed to a number
>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between items-center mt-4 w-full">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, employeeData.length)} of {employeeData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`inline-flex items-center px-3 py-2 border ${currentPage === index + 1 ? "bg-blue-50 border-blue-500 text-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"} rounded-md text-sm font-medium`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataGrid;