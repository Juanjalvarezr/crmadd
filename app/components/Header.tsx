import React from "react";
import { AppBar, Toolbar, Typography, Avatar, Box, IconButton, Menu, MenuItem, Badge, Chip, List, ListItem, ListItemIcon, ListItemText, Button } from "@mui/material";
import { FiLogOut, FiSettings, FiBell, FiUser, FiMenu, FiAlertCircle, FiTrendingUp, FiInfo, FiSun, FiMoon, FiSearch, FiEye, FiEyeOff } from "react-icons/fi";
import { useCRMStore } from "../store/useCRMStore";

interface HeaderProps {
  onMenuClick?: () => void;
  themeMode?: "light" | "dark";
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, themeMode = "dark", onToggleTheme }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = React.useState<null | HTMLElement>(null);
  const [isPresentationMode, setIsPresentationMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsPresentationMode(localStorage.getItem("presentation_mode") === "true");
    }
  }, []);

  const handleTogglePresentation = () => {
    const nextMode = !isPresentationMode;
    setIsPresentationMode(nextMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("presentation_mode", String(nextMode));
      window.dispatchEvent(new CustomEvent("presentation-mode-changed", { detail: nextMode ? 'on' : 'off' }));
    }
  };

  const handleOpenSearch = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-global-search"));
    }
  };

  const { notifications, markAsRead, clearNotifications } = useCRMStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <FiTrendingUp color="#4caf50" />;
      case 'warning': return <FiAlertCircle color="#ff9800" />;
      case 'error': return <FiAlertCircle color="#f44336" />;
      default: return <FiInfo color="#2196f3" />;
    }
  };

  const currentUser = {
    nombre: "Juan José Álvarez",
    email: "juanjose@seodigital.com",
    rol: "CEO & Founder",
    avatar: "JJ"
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: "primary" | "secondary" | "success" | "warning" | "error" } = {
      "Admin": "error",
      "Vendedor": "primary",
      "Manager": "warning",
      "Soporte": "success",
    };
    return colors[role] || "default";
  };

  const isDark = themeMode === "dark";

  return (
    <AppBar position="sticky" sx={{ zIndex: 1200, background: (theme) => theme.palette.mode === 'dark' ? 'rgba(13, 14, 21, 0.85)' : 'linear-gradient(90deg, #e91e63 0%, #9c27b0 100%)', backdropFilter: 'saturate(180%) blur(12px)' }}>
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
        <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ display: { sm: 'none' } }}>
          <FiMenu />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: { xs: 'none', sm: 'block' } }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
