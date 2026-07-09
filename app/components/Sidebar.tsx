import React from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Divider, Badge, Tooltip, Chip, Typography, IconButton } from "@mui/material";
import { 
  FiBarChart, FiUsers, FiTrendingUp, FiCheckSquare, FiSettings, FiHome, 
  FiBell, FiActivity, FiPackage, FiDownload, FiUpload, FiCalendar, 
  FiFileText, FiDollarSign, FiTarget, FiChevronLeft, FiChevronRight, FiFolder
} from "react-icons/fi";
import { Link, useLocation } from "react-router";

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: "Inicio", icon: FiHome, path: "/", notifications: 0, color: "#1976d2" },
  { label: "Clientes", icon: FiUsers, path: "/clientes", notifications: 0, color: "#4caf50" },
  { label: "Proyectos", icon: FiFolder, path: "/proyectos", notifications: 0, color: "#2196f3" },
  { label: "Equipo (Subagentes)", icon: FiUsers, path: "/equipo", notifications: 0, color: "#2196f3" },
  { label: "Servicios ★", icon: FiPackage, path: "/servicios", notifications: 0, color: "#ff9800" },
  { label: "Oportunidades", icon: FiTrendingUp, path: "/ventas", notifications: 0, color: "#9c27b0" },
  { label: "Tareas", icon: FiCheckSquare, path: "/tareas", notifications: 0, color: "#f44336" },
  { label: "Email Marketing 📧", icon: FiActivity, path: "/email-marketing", notifications: 0, color: "#e91e63" },
  { label: "Chatbot 💬", icon: FiBell, path: "/chatbot", notifications: 0, color: "#00c853" },
  { label: "Calendario", icon: FiCalendar, path: "/calendario", notifications: 0, color: "#ff9800" },
  { label: "Reportes", icon: FiBarChart, path: "/reportes", notifications: 0, color: "#607d8b" },
  { label: "Facturación", icon: FiFileText, path: "/facturacion", notifications: 0, color: "#ff5722" },
  { label: "Contratos", icon: FiFileText, path: "/contratos", notifications: 0, color: "#795548" },
  { label: "Configuración", icon: FiSettings, path: "/configuracion", notifications: 0, color: "#9e9e9e" },
];

const quickActions = [
  { label: "Exportar Datos", icon: FiDownload, action: "export", color: "#2196f3" },
  { label: "Importar CSV", icon: FiUpload, action: "import", color: "#4caf50", disabled: true },
  { label: "Calendario", icon: FiCalendar, action: "calendar", color: "#ff9800" },
  { label: "Reportes", icon: FiFileText, action: "reports", color: "#9c27b0" },
  { label: "Ventas", icon: FiDollarSign, action: "sales", color: "#4caf50" },
  { label: "Metas", icon: FiTarget, action: "goals", color: "#f44336" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  open, 
  onClose, 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const location = useLocation();

  const getNotificationCount = (path: string) => {
    const item = menuItems.find(item => item.path === path);
    return item?.notifications || 0;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'export':
        alert('Exportando datos a CSV...');
        break;
      case 'import':
        alert('Importando datos desde CSV...');
        break;
      case 'calendar':
        alert('Abriendo calendario...');
        break;
      case 'reports':
        alert('Generando reportes...');
        break;
      case 'sales':
        alert('Viendo panel de ventas...');
        break;
      case 'goals':
        alert('Configurando metas...');
        break;
      default:
        console.log('Acción no reconocida:', action);
    }
  };

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: "linear-gradient(180deg, #0d0e15 0%, #12131a 100%)",
      color: "#e2e8f0",
      position: "relative"
    }}>
      {/* Botón de alternancia de colapsado (Escritorio) */}
      {onToggleCollapse && (
        <IconButton
          onClick={onToggleCollapse}
          sx={{
            position: "absolute",
            top: 24,
            right: isCollapsed ? 12 : 16,
            zIndex: 10,
            color: "rgba(255, 255, 255, 0.6)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            width: 28,
            height: 28,
            "&:hover": {
              color: "#e91e63",
              backgroundColor: "rgba(233, 30, 99, 0.15)",
              borderColor: "rgba(233, 30, 99, 0.3)",
              boxShadow: "0 0 12px rgba(233, 30, 99, 0.4)",
              transform: "scale(1.1)"
            },
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            display: { xs: 'none', sm: 'flex' }
          }}
        >
          {isCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </IconButton>
      )}

      {/* Header del Sidebar - Logo DESEO DIGITAL */}
      <Box sx={{ 
        p: isCollapsed ? "24px 8px" : 3, 
        textAlign: "center", 
        background: "linear-gradient(135deg, rgba(233, 30, 99, 0.08) 0%, rgba(156, 39, 176, 0.08) 100%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        mb: 2,
        transition: "all 0.3s ease-in-out",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {isCollapsed ? (
          <Tooltip title="Deseo Digital" placement="right">
            <Box sx={{ 
              width: 42, 
              height: 42, 
              borderRadius: "12px", 
              background: "linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(233, 30, 99, 0.3)",
              cursor: "pointer",
              "&:hover": {
                transform: "rotate(10deg) scale(1.05)",
                boxShadow: "0 4px 20px rgba(233, 30, 99, 0.6)"
              },
              transition: "all 0.3s ease-in-out"
            }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "white", fontSize: "1.3rem" }}>
                D
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ width: "100%", pr: onToggleCollapse ? 3 : 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 2, color: "#ffffff" }}>
                DESEO
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 2, color: "#e91e63", textShadow: "0 0 10px rgba(233, 30, 99, 0.3)" }}>
                ★
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", letterSpacing: 4, color: "#9c27b0", fontSize: "1.1rem", mb: 1 }}>
              DIGITAL
            </Typography>
            <SafeChip 
              label="Agencia Inteligente" 
              size="small" 
              sx={{ 
                background: "rgba(0, 229, 255, 0.08)", 
                color: "#00e5ff", 
                border: "1px solid rgba(0, 229, 255, 0.2)",
                fontSize: "0.68rem",
                fontWeight: "bold",
                height: 20
              }} 
            />
          </Box>
        )}
      </Box>
      
      {/* Indicador de Estado */}
      <Box sx={{ px: 2, mb: 1.5, transition: "all 0.3s ease-in-out" }}>
        {isCollapsed ? (
          <Tooltip title="Sistema Activo" placement="right">
            <Box sx={{ 
              display: "flex", 
              justifyContent: "center", 
              py: 1,
              position: "relative"
            }}>
              <Box sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: "50%", 
                backgroundColor: "#4caf50",
                boxShadow: "0 0 0 0 rgba(76, 175, 80, 0.7)",
                animation: "pulse 1.8s infinite"
              }} />
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ 
            p: 1.2, 
            backgroundColor: "rgba(76, 175, 80, 0.04)", 
            borderRadius: 2,
            border: "1px solid rgba(76, 175, 80, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: "50%", 
              backgroundColor: "#4caf50",
              boxShadow: "0 0 0 0 rgba(76, 175, 80, 0.7)",
              animation: "pulse 1.8s infinite"
            }} />
            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#81c784", fontSize: "0.8rem", letterSpacing: 0.5 }}>
              SISTEMA ONLINE
            </Typography>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.05)", mb: 1 }} />
      
      {/* Menú Principal */}
      <List sx={{ px: 1.2, flexGrow: 1, overflowY: 'auto', py: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const notificationCount = getNotificationCount(item.path);
          
          const itemButton = (
            <ListItemButton
              component={Link}
              to={item.path}
              onClick={onClose}
              sx={{
                backgroundColor: isActive ? "rgba(233, 30, 99, 0.12)" : "transparent",
                color: isActive ? "#ffffff" : "#a0aec0",
                "&:hover": { 
                  backgroundColor: isActive ? "rgba(233, 30, 99, 0.18)" : "rgba(255, 255, 255, 0.03)",
                  color: "#ffffff",
                  "& .MuiListItemIcon-root": { color: "#e91e63" },
                  transform: isCollapsed ? "scale(1.05)" : "translateX(6px)"
                },
                borderRadius: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                py: 1.5,
                px: isCollapsed ? 1.5 : 2,
                display: "flex",
                justifyContent: isCollapsed ? "center" : "flex-start",
                position: "relative",
                mb: 0.8
              }}
            >
              {/* Indicador izquierdo brillante para item activo */}
              {isActive && (
                <Box sx={{
                  position: "absolute",
                  left: 0,
                  top: "20%",
                  height: "60%",
                  width: 4,
                  backgroundColor: "#e91e63",
                  borderRadius: "0 4px 4px 0",
                  boxShadow: "0 0 8px #e91e63"
                }} />
              )}

              <ListItemIcon sx={{ 
                minWidth: isCollapsed ? "auto" : 36,
                color: isActive ? "#e91e63" : "rgba(255, 255, 255, 0.5)",
                transition: "color 0.2s ease",
                justifyContent: "center"
              }}>
                <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Icon size={20} />
                  {notificationCount > 0 && (
                    <Badge 
                      badgeContent={notificationCount > 99 ? "99+" : notificationCount} 
                      color="error"
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        "& .MuiBadge-badge": {
                          fontSize: "0.58rem",
                          height: 14,
                          minWidth: 14,
                          backgroundColor: "#f44336",
                          border: "2px solid #0d0e15"
                        }
                      }}
                    />
                  )}
                </Box>
              </ListItemIcon>
              
              {!isCollapsed && (
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    m: 0,
                    pl: 1,
                    "& .MuiListItemText-primary": {
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.85rem",
                      letterSpacing: 0.3
                    }
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem disablePadding key={item.path} sx={{ display: "block" }}>
              {isCollapsed ? (
                <Tooltip title={item.label} placement="right" arrow>
                  {itemButton}
                </Tooltip>
              ) : (
                itemButton
              )}
            </ListItem>
          );
        })}

        <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.05)" }} />
        
        {/* Acciones Rápidas */}
        {!isCollapsed && (
          <Box sx={{ px: 2, mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: 1.5, fontSize: "0.68rem" }}>
              Herramientas
            </Typography>
          </Box>
        )}

        <Box sx={{ 
          px: isCollapsed ? 1 : 2, 
          display: "flex", 
          flexDirection: isCollapsed ? "column" : "row", 
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
          flexWrap: "wrap",
          gap: 1.2, 
          mb: 2 
        }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isDisabled = (action as any).disabled;
            const actionBtn = (
              <IconButton
                size="small"
                disabled={isDisabled}
                onClick={() => !isDisabled && handleQuickAction(action.action)}
                sx={{
                  backgroundColor: isDisabled ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  color: isDisabled ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.6)",
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  "&:hover": {
                    backgroundColor: isDisabled ? "rgba(255, 255, 255, 0.02)" : action.color,
                    color: isDisabled ? "rgba(255, 255, 255, 0.2)" : "#ffffff",
                    borderColor: isDisabled ? "rgba(255, 255, 255, 0.06)" : action.color,
                    transform: isDisabled ? "none" : "scale(1.1) translateY(-2px)",
                    boxShadow: isDisabled ? "none" : `0 4px 12px ${action.color}40`
                  },
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <Icon size={16} />
              </IconButton>
            );

            return (
              <Tooltip 
                title={isDisabled ? `${action.label} (Temporalmente deshabilitado por mantenimiento)` : action.label} 
                key={action.action} 
                placement="right" 
                arrow
              >
                <span style={{ display: "inline-flex" }}>{actionBtn}</span>
              </Tooltip>
            );
          })}
        </Box>
      </List>
      
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.05)" }} />
      
      {/* Footer del Sidebar */}
      <Box sx={{ 
        p: 2,
        backgroundColor: "rgba(0, 0, 0, 0.15)",
        textAlign: "center"
      }}>
        {isCollapsed ? (
          <Tooltip title="Versión 2.0.1 - © 2026 CRM Agencia" placement="right">
            <Typography variant="caption" sx={{ fontWeight: "bold", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}>
              v2.0
            </Typography>
          </Tooltip>
        ) : (
          <Box>
            <SafeChip 
              label="v2.0.1" 
              size="small" 
              variant="outlined"
              sx={{ 
                fontSize: "0.6rem",
                height: 18,
                borderColor: "rgba(255, 255, 255, 0.15)",
                color: "rgba(255, 255, 255, 0.4)",
                fontWeight: "bold",
                mb: 1
              }} 
            />
            <Typography variant="caption" sx={{ display: "block", color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>
              © 2026 DESEO DIGITAL CRM
            </Typography>
          </Box>
        )}
      </Box>

      {/* Estilos globales inyectados para micro-animaciones */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }
      `}</style>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ 
        width: { sm: isCollapsed ? 70 : 200, md: isCollapsed ? 70 : DRAWER_WIDTH }, 
        flexShrink: { sm: 0 },
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Drawer Móvil */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          zIndex: 1500,
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: DRAWER_WIDTH,
            border: "none"
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Drawer Escritorio */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: isCollapsed ? 70 : { sm: 200, md: DRAWER_WIDTH },
            backgroundColor: "#0d0e15",
            borderRight: "1px solid rgba(255, 255, 255, 0.05)",
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflowX: "hidden"
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export const DRAWER_WIDTH_CONST = DRAWER_WIDTH;

import { SafeChip } from "../components/SafeChip";
