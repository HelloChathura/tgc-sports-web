import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  error?: string; // Optional error message to display
}

export const Input: React.FC<InputProps> = ({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  className = "", 
  error 
}) => {
  return (
    <div className="input-wrapper">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input ${className} ${error ? 'input-error' : ''}`}
        aria-invalid={!!error}  // Accessibility for error state
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;
