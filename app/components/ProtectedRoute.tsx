import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Box, CircularProgress, Typography } from '@mui/material';
import { authService } from '../services/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = authService.isAuthenticated();
        
        if (!isAuthenticated) {
          // Redirigir a login si no está autenticado
          navigate('/login', { state: { from: location } });
          return;
        }

        // Si hay roles permitidos, verificar el rol del usuario
        if (allowedRoles && allowedRoles.length > 0) {
          const userRole = await authService.getUserRole();
          
          if (!userRole || !allowedRoles.includes(userRole)) {
            // Redirigir a dashboard si no tiene el rol adecuado
            navigate('/dashboard', { 
              state: { error: 'No tienes permisos para acceder a esta página' } 
            });
            return;
          }
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        navigate('/login', { state: { from: location } });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location, allowedRoles]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: '#0b0c10',
          color: '#ffffff',
        }}
      >
        <CircularProgress sx={{ color: '#e91e63', mb: 2 }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Verificando acceso...
        </Typography>
      </Box>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
