import React from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, useTheme, useMediaQuery } from '@mui/material';
import { FiUsers, FiCheckSquare, FiTrendingUp, FiFileText, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router';

export const MobileFab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const actions = [
    { icon: <FiUsers size={20} />, name: 'Nuevo Cliente', path: '/clientes?action=new' },
    { icon: <FiCheckSquare size={20} />, name: 'Nueva Tarea', path: '/tareas?action=new' },
    { icon: <FiFileText size={20} />, name: 'Nueva Factura', path: '/facturacion?action=new' },
    { icon: <FiTrendingUp size={20} />, name: 'Nueva Venta', path: '/ventas?action=new' },
  ];

  return (
    <SpeedDial
      ariaLabel="Acciones rápidas"
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1400,
        display: 'flex',
        '& .MuiSpeedDial-fab': {
          background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)',
          boxShadow: '0 8px 24px rgba(233,30,99,0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #d81b60 0%, #8e24aa 100%)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        },
        '& .MuiSpeedDialAction-staticTooltipLabel': {
          whiteSpace: 'nowrap',
        },
      }}
      icon={<SpeedDialIcon icon={<FiPlus size={24} />} openIcon={<FiPlus style={{ transform: 'rotate(45deg)' }} size={24} />} />}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          title={action.name}
          onClick={() => navigate(action.path)}
          sx={{
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e2e' : '#ffffff',
            color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#1f232e',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a3a' : '#f5f5f5',
              transform: 'scale(1.08)',
            },
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      ))}
    </SpeedDial>
  );
};

