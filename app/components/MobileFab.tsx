import React from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, useTheme, useMediaQuery } from '@mui/material';
import { FiUsers, FiCheckSquare, FiTrendingUp, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router';

export const MobileFab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  if (!isMobile) return null;

  const actions = [
    { icon: <FiUsers size={20} />, name: 'Nuevo Cliente', path: '/clientes?action=new' },
    { icon: <FiCheckSquare size={20} />, name: 'Nueva Tarea', path: '/tareas?action=new' },
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
        '& .MuiSpeedDial-fab': {
          backgroundColor: '#e91e63',
          '&:hover': {
            backgroundColor: '#c2185b',
          }
        }
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
            backgroundColor: '#fff',
            color: '#e91e63',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            }
          }}
        />
      ))}
    </SpeedDial>
  );
};
