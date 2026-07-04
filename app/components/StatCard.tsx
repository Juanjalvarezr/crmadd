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
    primary: { bg: "primary.main", fg: "primary.contrastText", light: "primary.light" },
    secondary: { bg: "secondary.main", fg: "secondary.contrastText", light: "secondary.light" },
    success: { bg: "success.main", fg: "success.contrastText", light: "success.light" },
    warning: { bg: "warning.main", fg: "warning.contrastText", light: "warning.light" },
    error: { bg: "error.main", fg: "error.contrastText", light: "error.light" },
    info: { bg: "info.main", fg: "info.contrastText", light: "info.light" },
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
        p: { xs: 2, sm: 3 },
        height: "100%",
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-4px)' },
          boxShadow: { xs: 1, sm: 6 },
          borderColor: colorConfig.bg
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: "space-between", mb: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box 
            sx={{ 
              p: { xs: 1, sm: 1.5 }, 
              borderRadius: 2.5, 
              bgcolor: `${color}.light`,
              color: `${color}.dark`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ml: 1
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      
      {trend && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          <TrendIcon 
            size={16} 
            color={trend.isPositive ? "success.main" : "error.main"} 
          />
          <Typography 
            variant="body2" 
            color={trend.isPositive ? "success.main" : "error.main"}
            sx={{ fontWeight: 700 }} 
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
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
