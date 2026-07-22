import React, { useState, useEffect } from 'react';
import { Box, IconButton, Paper, Typography, TextField, Button, Fade, Tooltip, Snackbar, Alert, CircularProgress } from '@mui/material';
import { FiX, FiCpu } from 'react-icons/fi';
import confetti from 'canvas-confetti';
import { aiService, ejecutarAccionSincrona } from '../services/ai';
import { useChatStore, ProposalSchema } from '../store/useChatStore';

export const openAiRoute = (route: string, entity?: string, label?: string) => {
  window.dispatchEvent(new CustomEvent('open-ai-chat'));
  window.dispatchEvent(
    new CustomEvent('open-assistant', {
      detail: { route, entity, label },
    })
  );
};

export const openAiProjectContext = (project: any) => {
  window.dispatchEvent(
    new CustomEvent('open-assistant', {
      detail: {
        route: '/proyecto',
        entity: 'proyecto',
        label: project?.nombre || 'Proyecto',
        proyectoId: project?.id || project?.proyecto_id || null,
        proyectoNombre: project?.nombre || null,
      },
    })
  );
};

export const FloatingAIAssistant = () => {
  const {
    isAssistantOpen: isOpen,
    setAssistantOpen: setIsOpen,
    proposalInput,
    setProposalInput,
    proposalResult: resultText,
    setProposalResult: setResultText
  } = useChatStore();

  const [mode, setMode] = useState<'chat' | 'proposal'>('chat');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [aiContext, setAiContext] = useState<{
    route?: string;
    entity?: string;
    label?: string;
    proyectoId?: string | null;
    proyectoNombre?: string | null;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Hola, soy el copiloto del CRM. Estoy conectado al proyecto activo. Escribí una orden, por ejemplo: “Generar brief del proyecto”, “Actualizar seguimiento” o “Analizar facturación”.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      setAiContext({
        route: detail.route,
        entity: detail.entity,
        label: detail.label,
        proyectoId: detail.proyectoId ?? detail.proyecto?.id ?? null,
        proyectoNombre: detail.proyectoNombre ?? detail.proyecto?.nombre ?? null,
      });
      setIsOpen(true);
    };
    window.addEventListener('open-assistant', handler as any);
    window.addEventListener('open-ai-chat', handler as any);
    return () => {
      window.removeEventListener('open-assistant', handler as any);
      window.removeEventListener('open-ai-chat', handler as any);
    };
  }, []);

  if (!isClient) return null;

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || isLoading) return;

    const contexto = aiContext
      ? `\nCONTEXTO ACTUAL:\n- Ruta: ${aiContext.route || ''}\n- Entidad: ${aiContext.entity || ''}\n- Nombre/Referencia: ${aiContext.label || ''}\n- Proyecto: ${aiContext.proyectoNombre || aiContext.proyectoId || ''}`
      : '';

    setChatMessages((m) => [...m, { role: 'user', text }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const respuesta = await aiService.chatAsistente(text, contexto);
      const textoFinal = typeof respuesta === 'string' ? respuesta : JSON.stringify(respuesta);

      let ejecucion = '';
      let accionError: string | null = null;
      try {
        const res = await ejecutarAccionSincrona(text, textoFinal);
        if (typeof res === 'string') ejecucion = res;
      } catch (e: any) {
        accionError = e?.message || 'No se pudo ejecutar la acción';
      }

      let mensajeFinal = textoFinal;
      if (ejecucion) {
        mensajeFinal += `\n\n---\n✅ ${ejecucion}`;
      }
      if (accionError) {
        mensajeFinal += `\n\n---\n⚠️ ${accionError}`;
        setSnackbar({ open: true, message: accionError, severity: 'error' });
      }

      setChatMessages((m) => [...m, { role: 'assistant', text: mensajeFinal }]);
    } catch (e: any) {
      const mensaje = `Error: ${e?.message || 'No se pudo ejecutar'}`;
      setChatMessages((m) => [...m, { role: 'assistant', text: mensaje }]);
      setSnackbar({ open: true, message: mensaje, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const executeGenerateProposal = async () => {
    const validation = ProposalSchema.safeParse(proposalInput);
    if (!validation.success) {
      setSnackbar({ open: true, message: validation.error.issues[0].message, severity: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const resultado = await aiService.generarPropuesta(proposalInput);
      setResultText(resultado);
      setSnackbar({ open: true, message: 'Propuesta generada correctamente', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Error al generar', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text?: string) => {
    const copyText = text || resultText || '';
    if (!copyText) return;
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Fade in={isOpen}>
      <Paper
        id="floating-ai-assistant"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: { xs: '92vw', sm: 420 },
          maxHeight: '80vh',
          zIndex: 1600,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
        elevation={8}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiCpu />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Copiloto CRM</Typography>
            {aiContext?.proyectoNombre && (
              <Typography variant="caption" color="text.secondary">{aiContext.proyectoNombre}</Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setIsOpen(false)}><FiX /></IconButton>
        </Box>

        <Box sx={{ p: 1.5, overflowY: 'auto', flex: 1 }}>
          {chatMessages.slice(-12).map((m, idx) => (
            <Box key={idx} sx={{ mb: 1, textAlign: m.role === 'user' ? 'right' : 'left' }}>
              <Paper sx={{ p: 1, bgcolor: m.role === 'user' ? 'primary.main' : 'action.hover', color: m.role === 'user' ? 'primary.contrastText' : 'text.primary', display: 'inline-block', maxWidth: '100%', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                {m.text}
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
              <Typography variant="caption">Pensando...</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Escribí una orden..."
            />
            <Button variant="contained" onClick={sendChat} disabled={isLoading}>Enviar</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" onClick={() => sendChat()}>Generar brief</Button>
            <Button size="small" variant="outlined" onClick={() => setMode(mode === 'chat' ? 'proposal' : 'chat')}>Modo propuesta</Button>
            <Button size="small" variant="text" onClick={() => handleCopy(resultText)}>{copied ? 'Copiado' : 'Copiar'}</Button>
          </Box>
        </Box>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
        </Snackbar>
      </Paper>
    </Fade>
  );
};