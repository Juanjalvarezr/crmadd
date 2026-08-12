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
      elevation={0}
      sx={{ 
        p: { xs: 2, sm: 2.5 },
        height: "100%",
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-3px)' },
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 6px 18px rgba(0,0,0,0.08)',
          borderColor: colorConfig.bg
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: "space-between", mb: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.6rem', sm: '2rem' }, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
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
              p: { xs: 1, sm: 1.25 }, 
              borderRadius: 2.5, 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : `${color}.light`,
              color: `${color}.main`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ml: 1,
              flexShrink: 0
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
            style={{ color: trend.isPositive ? "#4caf50" : "#f44336" }} 
          />
          <Typography 
            variant="body2" 
            sx={{ fontWeight: 700, color: trend.isPositive ? "success.main" : "error.main", fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem' }} 
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
