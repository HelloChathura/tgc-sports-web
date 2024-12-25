// components/ui/use-toast.tsx

interface ToastOptions {
    title: string;
    description: string;
    variant: "success" | "error" | "info" | "destructive"; // You can add more variants if needed
  }
  
  export const toast = ({ title, description, variant }: ToastOptions) => {
    // You can replace this with the logic to show the toast notifications
    console.log("Toast Triggered:", { title, description, variant });
  };
  
  // Usage example
  toast({
    title: "Error",
    description: "Please enter a player name.",
    variant: "destructive",
  });
  