import React from "react";
import { Box, Paper, Typography, CardContent } from "@mui/material";
import { FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign, FiTarget, FiActivity } from "react-icons/fi";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
}

const getColorConfig = (color: string = "primary") => {
  const colors = {
    primary: { bg: "#e3f2fd", color: "#1976d2" },
    secondary: { bg: "#fce4ec", color: "#dc004e" },
    success: { bg: "#e8f5e8", color: "#4caf50" },
    warning: { bg: "#fff3e0", color: "#ff9800" },
    error: { bg: "#ffebee", color: "#f44336" },
    info: { bg: "#e0f2f1", color: "#009688" }
  };
  return colors[color as keyof typeof colors] || colors.primary;
};

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = "primary" 
}) => {
  const colorConfig = getColorConfig(color);
  const TrendIcon = trend?.isPositive ? FiTrendingUp : FiTrendingDown;

  return (
    <Paper 
      sx={{ 
        p: 3, 
        height: "100%",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              backgroundColor: colorConfig.bg,
              color: colorConfig.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      
      {trend && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TrendIcon 
            size={16} 
            color={trend.isPositive ? "#4caf50" : "#f44336"}
          />
          <Typography 
            variant="body2" 
            color={trend.isPositive ? "success.main" : "error.main"}
            sx={{ fontWeight: "medium" }}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs mes anterior
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export const ClientesIcon = () => <FiUsers size={24} />;
export const VentasIcon = () => <FiDollarSign size={24} />;
export const ConversionIcon = () => <FiTarget size={24} />;
export const ActividadIcon = () => <FiActivity size={24} />;
