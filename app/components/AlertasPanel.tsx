import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, Chip, Stack } from '@mui/material';
import { FiAlertCircle } from 'react-icons/fi';
import { getAlertas, Alerta } from '../services/alertasService';

const COLOR: Record<Alerta['severidad'], string> = { alta: '#c62828', media: '#ef6c00', baja: '#616161' };

export default function AlertasPanel() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const a = await getAlertas();
      if (mounted) { setAlertas(a); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading || alertas.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 1, mb: 1, borderColor: 'rgba(230,57,70,0.35)', bgcolor: 'rgba(230,57,70,0.04)' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, color: '#c62828' }}>
        <FiAlertCircle size={12} /> Alertas ({alertas.length})
      </Typography>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
        {alertas.map((a) => (
          <Chip
            key={a.id}
            size="small"
            label={`${a.cliente} · ${a.mensaje}`}
            sx={{ height: 22, fontSize: '0.68rem', bgcolor: 'rgba(255,255,255,0.7)', color: COLOR[a.severidad], fontWeight: 600 }}
          />
        ))}
      </Stack>
    </Paper>
  );
}
