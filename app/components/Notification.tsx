import React from "react";

export interface NotificationProps {
  message: string;
  type?: "success" | "error" | "info";
}

export const Notification: React.FC<NotificationProps> = ({ message, type = "info" }) => {
  const colors = {
    success: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700",
    error: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700",
    info: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700",
  };
  return (
    <div className={`border-l-4 p-4 mb-4 rounded ${colors[type]}`}>{message}</div>
  );
};
