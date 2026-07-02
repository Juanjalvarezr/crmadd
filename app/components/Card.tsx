import React from "react";

export interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm bg-white dark:bg-gray-900">
    <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
    <div>{children}</div>
  </div>
);
