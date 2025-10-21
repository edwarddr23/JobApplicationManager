import React from "react";

interface TextInputBoxProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const TextInputBox: React.FC<TextInputBoxProps> = ({
  label,
  type,
  value,
  onChange,
  required = false,
}) => {
  return (
    <div>
      <label>{label}:</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
};

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset"
}

export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};
