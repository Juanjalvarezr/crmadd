import React from "react";
import { Paper, Box, Typography } from "@mui/material";
import { FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign, FiTarget, FiActivity } from "react-icons/fi";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  compact?: boolean;
}

const getColorConfig = (color: string = "primary") => {
  const colors = {
    primary: { bg: "primary.main", fg: "primary.contrastText", light: "primary.light" },
    secondary: { bg: "secondary.main", fg: "secondary.contrastText", light: "secondary.light" },
    success: { bg: "success.main", fg: "success.contrastText", light: "success.light" },
    warning: { bg: "warning.main", fg: "warning.dark", light: "warning.light" },
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
  color = "primary",
  compact = false
}) => {
  const colorConfig = getColorConfig(color);
  const TrendIcon = trend?.isPositive ? FiTrendingUp : FiTrendingDown;

  return (
    <Paper 
      sx={{ 
        p: compact ? 1 : 1.5,
        height: "100%",
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-2px)' },
          boxShadow: 3,
          borderColor: colorConfig.bg,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          bgcolor: colorConfig.bg,
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: 0.5, 
              fontSize: '0.65rem',
              color: 'text.secondary',
              display: 'block',
              mb: 0.25
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant={compact ? "h6" : "h4"} 
            sx={{ 
              fontWeight: 800, 
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontSize: '1.25rem'
            }}
          >
            {value}
          </Typography>
          {subtitle && !compact && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box 
            sx={{ 
              p: 0.5, 
              borderRadius: 1.5, 
              bgcolor: `${color}.light`,
              color: `${color}.dark`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ml: 1,
              opacity: 0.9
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      
      {trend && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          <TrendIcon 
            size={14} 
            color={trend.isPositive ? "success.main" : "error.main"} 
          />
          <Typography 
            variant="caption" 
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            vs anterior
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export const ClientesIcon = () => <FiUsers size={22} />;
export const VentasIcon = () => <FiDollarSign size={22} />;
export const ConversionIcon = () => <FiTarget size={22} />;
export const ActividadIcon = () => <FiActivity size={22} />;