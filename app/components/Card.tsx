import React from "react";

export interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = "", action }) => (
  <div className={`rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-900/90 backdrop-blur-xs ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
      {action && <div>{action}</div>}
    </div>
    <div>{children}</div>
  </div>
);

