interface ButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    type?: "button" | "submit" | "reset";
    className?: string;
    variant?: "primary" | "outline" | "solid" | "text" | "destructive" | "secondary";
  }
  
  export const Button: React.FC<ButtonProps> = ({
    onClick,
    children,
    type = "button",
    className = "",
    variant = "solid",
  }) => {
    // Define base button styles
    const baseClasses = "py-2 px-4 rounded-md focus:outline-none focus:ring-2";
  
    // Define variant-specific classes
    const variantClasses =
      variant === "outline"
        ? "border-2 border-gray-600 text-gray-600 hover:bg-gray-100"
        : variant === "solid"
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : variant === "text"
        ? "text-blue-600 hover:text-blue-800"
        : variant === "destructive"
        ? "bg-red-600 text-white hover:bg-red-700"
        : variant === "secondary"
        ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
        : ""; // Default style if no variant is provided
  
    // Combine the base and variant-specific styles, and add custom classes
    const buttonClasses = `${baseClasses} ${variantClasses} ${className}`;
  
    return (
      <button onClick={onClick} type={type} className={buttonClasses}>
        {children}
      </button>
    );
  };
  
  export default Button;
  