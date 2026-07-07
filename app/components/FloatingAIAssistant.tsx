import React, { useState, useEffect } from 'react';
import { Box, IconButton, Paper, Typography, TextField, Button, Fade, Tooltip, Snackbar, Alert } from '@mui/material';
import { FiX, FiCpu } from 'react-icons/fi';
import confetti from 'canvas-confetti';
// Inyectamos la lógica a través de un servicio desacoplado
import { aiService } from '../services/ai'; 
import { useChatStore, ProposalSchema } from '../store/useChatStore';

export const FloatingAIAssistant = () => {
  const {
    isAssistantOpen: isOpen,
    setAssistantOpen: setIsOpen,
    proposalInput,
    setProposalInput,
    proposalResult: resultText,
    setProposalResult: setResultText,
    saveProposalAsProject,
    addTokens
  } = useChatStore();

  const [mode, setMode] = useState<'chat' | 'proposal'>('proposal');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    const el = document.getElementById('floating-ai-assistant');
    el?.addEventListener('open-assistant', handler as EventListener);
    return () => el?.removeEventListener('open-assistant', handler as EventListener);
  }, []);

  if (!isClient) return null;

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || isLoading) return;

    setChatMessages((m) => [...m, { role: 'user', text }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const respuesta = await aiService.generarPropuesta({
        clienteNombre: text,
        clienteEmpresa: '',
        servicios: [],
        notasAdicionales: '',
      });

      const textoFinal = typeof respuesta === 'string' ? respuesta : JSON.stringify(respuesta);
      setChatMessages((m) => [...m, { role: 'assistant', text: textoFinal }]);
    } catch (e: any) {
      setChatMessages((m) => [...m, { role: 'assistant', text: `Error: ${e?.message || 'No se pudo ejecutar'}` }]);
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
    setResultText('');

    try {
      let currentText = '';
      await aiService.generarPropuesta(proposalInput, (chunk) => {
        currentText = chunk;
        setResultText(chunk);
      });

      const tokens = await aiService.contarTokens(currentText);
      addTokens(tokens);
      await saveProposalAsProject();

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e91e63', '#9c27b0', '#2196f3'],
      });

      setSnackbar({ open: true, message: '¡Estrategia generada y guardada como proyecto con éxito! 🎉', severity: 'success' });
    } catch (error: any) {
      setResultText(`**Error:** ${error.message || 'No se pudo conectar con la IA. Verifica tu API Key en el archivo .env'}`);
      setSnackbar({ open: true, message: 'Error al procesar la propuesta', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (typeof resultText !== 'string') return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Box id="floating-ai-assistant" sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        <Tooltip title="Asistente IA (Copiloto)" placement="left">
          <IconButton
            onClick={() => setIsOpen(true)}
            sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)',
              boxShadow: '0 8px 24px rgba(233,30,99,0.45)',
              color: 'white',
              '&:hover': {
                transform: 'scale(1.08)',
                boxShadow: '0 12px 32px rgba(233,30,99,0.55)',
                background: 'linear-gradient(135deg, #d81b60 0%, #8e24aa 100%)',
              },
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <FiCpu size={26} />
          </IconButton>
        </Tooltip>
      </Box>

      <Fade in={isOpen}>
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            top: { xs: 0, md: 20 },
            right: { xs: 0, md: 20 },
            bottom: { xs: 0, md: 20 },
            width: { xs: '100%', md: 450 },
            zIndex: 10000,
            borderRadius: { xs: 0, md: 3 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(233, 30, 99, 0.2)',
          }}
        >
          <Box
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiCpu size={24} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Copiloto IA
              </Typography>
            </Box>
            <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <FiX />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '1px solid #eee' }}>
            <Button
              fullWidth
              onClick={() => setMode('proposal')}
              sx={{
                borderRadius: 0,
                py: 1.5,
                borderBottom: mode === 'proposal' ? '3px solid #e91e63' : '3px solid transparent',
                color: mode === 'proposal' ? '#e91e63' : 'text.secondary',
                fontWeight: mode === 'proposal' ? 'bold' : 'normal',
              }}
            >
              Generar Propuesta
            </Button>
            <Button
              fullWidth
              onClick={() => setMode('chat')}
              sx={{
                borderRadius: 0,
                py: 1.5,
                borderBottom: mode === 'chat' ? '3px solid #e91e63' : '3px solid transparent',
                color: mode === 'chat' ? '#e91e63' : 'text.secondary',
                fontWeight: mode === 'chat' ? 'bold' : 'normal',
              }}
            >
              Chat Ejecutable
            </Button>
          </Box>

          <Box sx={{ p: 3, flex: 1, overflowY: 'auto', bgcolor: '#fbfbfb' }}>
            {mode === 'proposal' && (
              <>
                {!resultText && !isLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Ingresa los datos del cliente y dejaré que mi modelo de lenguaje genere una estrategia comercial estructurada.
                    </Typography>
                    <TextField
                      label="Nombre del Contacto"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={proposalInput.clienteNombre}
                      onChange={(e) => setProposalInput({ clienteNombre: e.target.value })}
                    />
                    <TextField
                      label="Nombre de la Empresa"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={proposalInput.clienteEmpresa}
                      onChange={(e) => setProposalInput({ clienteEmpresa: e.target.value })}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={executeGenerateProposal}
                      disabled={!proposalInput.clienteNombre || !proposalInput.clienteEmpresa}
                      sx={{
                        mt: 2,
                        background: 'linear-gradient(135deg, #2196f3, #00bcd4)',
                        fontWeight: 'bold',
                        py: 1.5,
                      }}
                      startIcon={<FiCpu />}
                    >
                      Magia: Crear Estrategia
                    </Button>
                  </Box>
                ) : isLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="body2">Generando propuesta…</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e91e63' }}>
                        Propuesta lista
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={handleCopy}>
                          {copied ? 'Copiado' : 'Copiar'}
                        </Button>
                        <Button size="small" onClick={() => setResultText('')}>
                          Nueva
                        </Button>
                      </Box>
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      {typeof resultText === 'string' ? resultText : JSON.stringify(resultText, null, 2)}
                    </Paper>
                  </Box>
                )}
              </>
            )}

            {mode === 'chat' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {chatMessages.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Escribí una orden, por ejemplo:
                      <br />• “Crear factura para Juan por 100000”
                      <br />• “Enviar WhatsApp al cliente”
                      <br />• “Crear tarea de seguimiento”
                    </Typography>
                  )}
                  {chatMessages.map((msg, i) => (
                    <Box
                      key={i}
                      sx={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        bgcolor: msg.role === 'user' ? '#e91e63' : '#fff',
                        color: msg.role === 'user' ? '#fff' : 'text.primary',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none',
                        maxWidth: '85%',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      <Typography variant="body2">{msg.text}</Typography>
                    </Box>
                  ))}
                  {isLoading && (
                    <Box sx={{ alignSelf: 'flex-start', bgcolor: '#fff', px: 2, py: 1, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="body2">Pensando…</Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribí una orden para el CRM..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                  />
                  <Button variant="contained" onClick={sendChat} disabled={isLoading || !chatInput.trim()}>
                    Enviar
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Fade>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
