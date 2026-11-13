import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Chip, Stack,
  Divider, Avatar, Button, Tooltip,
} from '@mui/material';
import { FiX, FiClock, FiMessageSquare, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { BRAND } from '../theme';

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: any;
}

interface Interaccion {
  id: number;
  tipo?: string;
  asunto?: string;
  contenido?: string;
  detalle?: string;
  usuario?: string;
  fecha?: string;
  created_at?: string;
}

const COLOR_TIPO: Record<string, string> = {
  'Asesoría': BRAND.primary,
  'Cotización': BRAND.warning,
  'Propuesta': BRAND.secondary,
  'Interés': BRAND.success,
  'Servicios consultados': BRAND.info,
  'Compromiso': BRAND.purple,
  WhatsApp: '#25D366',
  Email: '#9c27b0',
  Llamada: '#00bcd4',
  Cita: '#ff9800',
  Nota: '#9e9e9e',
};

function recomendaciones(cliente: any, interacciones: Interaccion[]): string[] {
  const out: string[] = [];
  const ultima = cliente?.ultima_interaccion ? new Date(cliente.ultima_interaccion) : null;
  const dias = ultima ? Math.floor((Date.now() - ultima.getTime()) / 86400000) : null;
  const etapa = cliente?.etapa || 'Nuevo';

  if (!cliente?.telefono) out.push('Cargá el teléfono del cliente para poder enviar WhatsApp.');
  if (interacciones.length === 0) out.push('Sin gestiones registradas: hacé el primer contacto.');
  if (dias !== null && dias >= 7) out.push(`Lleva ${dias} días sin contacto: hacé un seguimiento.`);
  if (etapa === 'Interesado') out.push('Está interesado y aún no hay propuesta: enviá una propuesta.');
  if (etapa === 'Propuesta' && (dias === null || dias >= 3)) out.push('Propuesta enviada sin respuesta: hacé seguimiento o llamá.');
  if (etapa === 'Negociación') out.push('Está en negociación: definir cierre y fecha.');
  return out.slice(0, 4);
}

export default function HistorialCliente({ open, onClose, cliente }: Props) {
  const [items, setItems] = useState<Interaccion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !cliente?.id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('interacciones')
        .select('*')
        .eq('cliente_id', cliente.id)
        .limit(50);
      if (!mounted) return;
      if (error) console.error('[historial]', error);
      const list = (data || []) as Interaccion[];
      list.sort((a, b) => String(b.created_at || b.fecha || '').localeCompare(String(a.created_at || a.fecha || '')));
      setItems(list);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [open, cliente?.id]);

  const recs = useMemo(() => recomendaciones(cliente, items), [cliente, items]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>Historial · {cliente?.nombre || 'cliente'}</Typography>
        <IconButton onClick={onClose} size="small"><FiX /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0.5 }}>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip size="small" label={`Etapa: ${cliente?.etapa || 'Nuevo'}`} sx={{ bgcolor: 'rgba(233,30,99,0.12)', color: BRAND.secondary, fontWeight: 700 }} />
            <Chip size="small" variant="outlined" label={`${items.length} gestiones`} />
          </Box>

          {recs.length > 0 && (
            <Box sx={{ p: 1, borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: 'rgba(255,152,0,0.06)' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: BRAND.warning, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FiAlertCircle size={12} /> Recomendaciones
              </Typography>
              {recs.map((r, i) => (
                <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                  • {r}
                </Typography>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 0.5 }} />

          {loading && <Typography variant="body2" color="text.secondary">Cargando historial…</Typography>}
          {!loading && items.length === 0 && (
            <Typography variant="body2" color="text.secondary">Sin gestiones todavía.</Typography>
          )}

          <Stack spacing={0}>
            {items.map((it, idx) => {
              const color = COLOR_TIPO[it.tipo || 'Nota'] || BRAND.primary;
              return (
                <Box key={it.id} sx={{ display: 'flex', gap: 1 }}>
                  {/* linea de tiempo */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 18 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, mt: 0.75, flexShrink: 0 }} />
                    {idx < items.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider' }} />}
                  </Box>
                  <Box sx={{ pb: 1.5, flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip size="small" label={it.tipo || 'Nota'} sx={{ height: 20, fontSize: '0.65rem', bgcolor: color, color: '#fff', fontWeight: 700 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3 }}>
                        <FiClock size={11} />
                        {new Date(it.created_at || it.fecha || Date.now()).toLocaleString('es-CO')}
                      </Typography>
                    </Box>
                    {(it.asunto || it.contenido || it.detalle) && (
                      <Typography variant="body2" sx={{ mt: 0.25, fontSize: '0.82rem' }}>
                        {it.asunto || it.contenido || it.detalle}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
