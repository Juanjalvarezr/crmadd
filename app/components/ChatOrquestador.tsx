import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack } from '@mui/material';
import { aiService } from '../services/ai';

interface Msg { role: 'user' | 'ia'; text: string }

export default function ChatOrquestador() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  const enviar = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setHistory((h) => [...h, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const r = await aiService.chatConDatosReales(q);
      setHistory((h) => [...h, { role: 'ia', text: r }]);
    } catch (e: any) {
      setHistory((h) => [...h, { role: 'ia', text: e?.message || 'No pude procesar la orden.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Escribí una orden y la ejecuto sobre el CRM: crear tareas, actualizar clientes o proyectos, agendar citas, guardar procesos.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        {history.length === 0 && (
          <Paper sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Ejemplo: crear una tarea para revisar el contrato de Juan
            </Typography>
          </Paper>
        )}
        {history.map((m, i) => (
          <Paper key={i} sx={{ p: 1.2, borderRadius: 2, bgcolor: m.role === 'user' ? '#fce4ec' : '#fff', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              {m.role === 'user' ? 'Vos' : 'Copiloto'}
            </Typography>
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
              {m.text}
            </Typography>
          </Paper>
        ))}
        {loading && <Typography variant="caption" color="text.secondary">Ejecutando…</Typography>}
      </Box>
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth size="small" multiline maxRows={3}
          placeholder="Escribí una orden…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          disabled={loading}
        />
        <Button variant="contained" onClick={enviar} disabled={loading || !input.trim()} sx={{ minWidth: 64, bgcolor: '#e91e63' }}>
          Enviar
        </Button>
      </Stack>
    </>
  );
}
