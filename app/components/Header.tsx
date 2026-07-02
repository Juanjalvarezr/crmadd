import React from "react";
import { AppBar, Toolbar, Typography, Avatar, Box, IconButton, Menu, MenuItem, Badge, Chip, Divider, List, ListItem, ListItemIcon, ListItemText, Button } from "@mui/material";
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
    <AppBar position="sticky" sx={{ zIndex: 1200, background: (theme) => theme.palette.mode === 'dark' ? "rgba(13, 14, 21, 0.85)" : "linear-gradient(90deg, #e91e63 0%, #9c27b0 100%)", backdropFilter: "blur(10px)", boxShadow: 'none', borderBottom: "1px solid", borderColor: "divider" }}>
      <Toolbar variant="dense" sx={{
        display: "flex",
        justifyContent: "space-between",
        minHeight: { xs: 50, sm: 60 },
        px: { xs: 1, sm: 2 }
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 2 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 1, display: { sm: 'none' } }}
          >
            <FiMenu />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "0.9rem", sm: "1.1rem" },
              letterSpacing: 1
            }}
          >
            DESEO DIGITAL
          </Typography>
          <Chip
            label="320 369 8476"
            size="small"
            sx={{
              backgroundColor: "#ffd700",
              color: "#333",
              fontWeight: "bold",
              fontSize: "0.7rem",
              display: { xs: "none", sm: "flex" }
            }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            color="inherit"
            title="Notificaciones"
            onClick={handleNotificationMenu}
            sx={{ position: "relative" }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <FiBell size={20} />
            </Badge>
          </IconButton>

          <IconButton color="inherit" onClick={handleOpenSearch} title="Buscar... (Ctrl+K)">
            <FiSearch size={20} />
          </IconButton>

          <IconButton color="inherit" onClick={handleTogglePresentation} title={isPresentationMode ? "Desactivar Modo Presentación" : "Activar Modo Presentación"}>
            {isPresentationMode ? <FiEyeOff size={20} color="#e91e63" /> : <FiEye size={20} />}
          </IconButton>

          <IconButton color="inherit" onClick={onToggleTheme} title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Noche"}>
            {isDark ? <FiSun size={20} color="#ffd700" /> : <FiMoon size={20} />}
          </IconButton>

          <IconButton color="inherit" title="Configuración">
            <FiSettings size={20} />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={handleMenu}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                backgroundColor: "#ff9800",
                fontWeight: "bold",
                fontSize: "1rem",
                border: "2px solid rgba(255,255,255,0.3)"
              }}
            >
              {currentUser.avatar}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ color: "white", fontWeight: "medium" }}>
                {currentUser.nombre}
              </Typography>
              <Chip
                label={currentUser.rol}
                size="small"
                color={getRoleColor(currentUser.rol)}
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: "bold"
                }}
              />
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 200,
                }
              }
            }}
            transformOrigin={{ horizontal: "right", vertical: "bottom" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem onClick={handleClose}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <FiUser size={16} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                    {currentUser.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentUser.email}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FiSettings size={16} />
                Configuración
              </Box>
            </MenuItem>
            <MenuItem onClick={handleClose} sx={{ color: "error.main" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FiLogOut size={16} />
                Cerrar sesión
              </Box>
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 280,
                  maxHeight: 400,
                }
              }
            }}
            transformOrigin={{ horizontal: "right", vertical: "bottom" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Notificaciones
              </Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={clearNotifications}>Limpiar</Button>
              )}
            </Box>

            <List sx={{ p: 0 }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No hay notificaciones</Typography>
                </Box>
              ) : (
                notifications.map((n) => (
                  <ListItem
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    sx={{
                      backgroundColor: n.read ? 'transparent' : 'rgba(33, 150, 243, 0.04)',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotifIcon(n.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: n.read ? "normal" : "bold" }}>{n.title}</Typography>}
                      secondary={
                        <React.Fragment>
                          <Typography variant="caption" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>{n.message}</Typography>
                          <Typography variant="caption" color="text.secondary">{n.time}</Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
