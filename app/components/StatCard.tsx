import React from "react";
import { Box, Paper, Typography } from "@mui/material";
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
        p: { xs: 0.75, sm: 1 },
        height: "100%",
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all 0.15s ease',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-1px)' },
          boxShadow: { xs: 0, sm: 1 },
          borderColor: colorConfig.bg
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: { xs: 'center', sm: 'center' }, justifyContent: "space-between", mb: { xs: 0.25, sm: 0.5 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.15, lineHeight: { xs: 1, sm: 1.2 }, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box 
            sx={{ 
              p: { xs: 0.5, sm: 0.75 }, 
              borderRadius: 1.5, 
              bgcolor: `${color}.light`,
              color: `${color}.dark`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ml: 0.5
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      
      {trend && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mt: 0.25 }}>
          <TrendIcon 
            size={12} 
            color={trend.isPositive ? "success.main" : "error.main"} 
          />
          <Typography 
            variant="caption"
            color={trend.isPositive ? "success.main" : "error.main"}
            sx={{ fontWeight: 700, fontSize: { xs: '0.55rem', sm: '0.65rem' } }} 
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
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
