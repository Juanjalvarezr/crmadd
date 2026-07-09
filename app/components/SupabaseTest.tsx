// Componente de estado de conexión Supabase - Compacto y elegante
import { useState, useEffect } from 'react';
import { Box, Chip, Tooltip, CircularProgress } from '@mui/material';
import { FiWifi, FiWifiOff, FiDatabase } from 'react-icons/fi';
import { supabase } from '../services/supabase';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [clientesCount, setClientesCount] = useState<number>(0);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { count, error } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          setStatus('error');
        } else {
          setStatus('connected');
          setClientesCount(count || 0);
        }
      } catch {
        setStatus('error');
      }
    };

    checkConnection();
  }, []);

  if (status === 'checking') {
    return (
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <SafeChip 
          label="Conectando a Supabase..." 
          size="small" 
          color="default" 
          variant="outlined"
        />
      </Box>
    );
  }

  if (status === 'connected') {
    return (
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FiWifi color="#4caf50" size={18} />
        <Tooltip title="Base de datos conectada y sincronizada">
          <SafeChip 
            icon={<FiDatabase size={14} />}
            label={`Supabase • ${clientesCount} clientes`} 
            size="small" 
            color="success" 
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <FiWifiOff color="#f44336" size={18} />
      <Tooltip title="Verifica que la tabla 'clientes' exista en Supabase y la política RLS esté creada">
        <SafeChip 
          label="Sin conexión a Supabase" 
          size="small" 
          color="error" 
          variant="outlined"
          sx={{ fontWeight: 500 }}
          onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
        />
      </Tooltip>
    </Box>
  );
}
