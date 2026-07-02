import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, ...props }) => (
  <label className="block mb-4">
    <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</span>
    <input
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
      {...props}
    />
  </label>
);
