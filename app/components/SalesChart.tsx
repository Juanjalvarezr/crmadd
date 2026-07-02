import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SalesChartProps {
  data: Array<{ month: string; sales: number; target: number }>;
  type?: "line" | "bar";
  title?: string;
}

export const SalesChart: React.FC<SalesChartProps> = ({ 
  data, 
  type = "line", 
  title = "Ventas vs Objetivo" 
}) => {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: "Ventas Reales",
        data: data.map(item => item.sales),
        borderColor: "#1976d2",
        backgroundColor: type === "line" ? "rgba(25, 118, 210, 0.1)" : "rgba(25, 118, 210, 0.6)",
        borderWidth: 2,
        tension: 0.4,
        fill: type === "line",
      },
      {
        label: "Objetivo",
        data: data.map(item => item.target),
        borderColor: "#dc004e",
        backgroundColor: type === "line" ? "rgba(220, 0, 78, 0.1)" : "rgba(220, 0, 78, 0.6)",
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        fill: type === "line",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#333",
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += new Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "EUR",
            }).format(context.parsed.y);
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
            }).format(value);
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  const ChartComponent = type === "line" ? Line : Bar;

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
        {title}
      </Typography>
      <Box sx={{ height: 320 }}>
        <ChartComponent data={chartData} options={options} />
      </Box>
    </Paper>
  );
};
