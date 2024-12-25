import { ReactNode } from "react";

// Dialog Container
interface DialogProps {
    children: ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void; 
  }
  
  export const Dialog = ({ children, open }: DialogProps) => {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-80 transition-opacity duration-300 z-50 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`relative transform transition-transform duration-300 mx-auto my-20 max-w-lg ${
            open ? "translate-y-0" : "-translate-y-10"
          }`}
        >
          {children}
        </div>
      </div>
    );
  };
  
// Dialog Content
interface DialogContentProps {
  children: ReactNode;
  className?: string; // Added className
}

export const DialogContent = ({ children, className = "" }: DialogContentProps) => {
    return (
      <div
        className={`relative bg-white rounded-lg p-6 mx-4 sm:mx-auto sm:my-20 sm:max-w-lg ${className}`}
      >
        {children}
      </div>
    );
  };

// Dialog Header
interface DialogHeaderProps {
  children: ReactNode;
  className?: string; // Added className
}

export const DialogHeader = ({ children, className = "" }: DialogHeaderProps) => {
  return (
    <div className={`text-xl font-semibold mb-4 ${className}`}>
      {children}
    </div>
  );
};

// Dialog Title
interface DialogTitleProps {
  children: ReactNode;
  className?: string; // Added className
}

export const DialogTitle = ({ children, className = "" }: DialogTitleProps) => {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
};

interface DialogTriggerProps {
    children: ReactNode;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
    className?: string;
  }

  export const DialogTrigger = ({
    children,
    onClick,
    variant = "primary",
    className = "",
  }: DialogTriggerProps) => {
    const variantStyles = {
      primary: "bg-blue-500 hover:bg-blue-600 text-white",
      secondary: "bg-gray-500 hover:bg-gray-600 text-white",
      danger: "bg-red-500 hover:bg-red-600 text-white",
    };
  
    return (
      <button
        className={`px-4 py-2 rounded-md ${variantStyles[variant]} ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  };

// Dialog Footer
interface DialogFooterProps {
  children: ReactNode;
  className?: string; // Added className
}

export const DialogFooter = ({ children, className = "" }: DialogFooterProps) => {
    return (
      <div className={`mt-4 flex flex-wrap justify-end gap-2 ${className}`}>
        {children}
      </div>
    );
  };
