import React, { useState, useEffect } from 'react';
import { 
  Box, IconButton, Paper, Typography, TextField, Button, 
  CircularProgress, Divider, Fade, Tooltip, Select, MenuItem, Skeleton,
  InputLabel, FormControl, Chip, Snackbar, Alert, Stack
} from '@mui/material';
import { FiX, FiZap, FiCpu, FiUser, FiBriefcase, FiCopy, FiCheck } from 'react-icons/fi';
import confetti from 'canvas-confetti';
import DOMPurify from 'dompurify';
// Inyectamos la lógica a través de un servicio desacoplado
import { aiService } from '../services/ai'; 
import { useChatStore, ProposalSchema } from '../store/useChatStore';
import ReactMarkdown from 'react-markdown';

// Tipado del Dominio (Idealmente en /domain/models/Proposal.ts)
export interface ProposalInput {
  clienteNombre: string;
  clienteEmpresa: string;
  servicios: string[];
  notasAdicionales: string;
}

// Desenvolver el export por defecto para compatibilidad total con SSR en entornos Node/Vite
const SafeReactMarkdown = (ReactMarkdown as any).default || ReactMarkdown;

export const FloatingAIAssistant = () => {
  // Consumir el Store Global
  const { 
    isAssistantOpen: isOpen, setAssistantOpen: setIsOpen,
    proposalInput, setProposalInput,
    proposalResult: resultText, setProposalResult: setResultText,
    saveProposalAsProject, addTokens
  } = useChatStore();

  const [mode, setMode] = useState<'chat' | 'proposal'>('proposal');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => { setIsClient(true); }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Lista simulada de servicios para el dropdown
  const serviciosDisponibles = React.useMemo(() => [
    "SEO Local", "Posicionamiento Orgánico", "Diseño Web Corporativo", 
    "E-commerce", "Gestión de Redes Sociales", "Pauta Digital (Ads)"
  ], []);

  // Caso de Uso: Generar Estrategia
  const executeGenerateProposal = async () => {
    // 1. Validación con Zod
    const validation = ProposalSchema.safeParse(proposalInput);
    if (!validation.success) {
      setSnackbar({
        open: true,
        message: validation.error.errors[0].message,
        severity: 'error'
      });
      return;
    }
    
    setIsLoading(true);
    setResultText('');
    try {
      // 2. Streaming (Mejora percepción de velocidad)
      let currentText = "";
      await aiService.generarPropuesta(proposalInput, (chunk) => {
        currentText = chunk;
        setResultText(chunk);
      });
      
      // Auditoría rápida de tokens (aprox 1 token cada 4 caracteres)
      const tokens = await aiService.contarTokens(currentText);
      addTokens(tokens);

      await saveProposalAsProject();

      // Efecto de Confeti (Crea una explosión desde el centro)
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e91e63', '#9c27b0', '#2196f3'],
        zIndex: 20000
      });

      setSnackbar({
        open: true,
        message: '¡Estrategia generada y guardada como proyecto con éxito! 🎉',
        severity: 'success'
      });
    } catch (error: any) {
      setResultText(`**Error:** ${error.message || "No se pudo conectar con la IA. Verifica tu API Key en el archivo .env"}`);
      setSnackbar({
        open: true,
        message: 'Error al procesar la propuesta',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Evitar renderizado hasta que el cliente esté listo para prevenir Hydration Errors
  if (!isClient) return null;

  return (
    <>
      {/* El Avatar Flotante */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        <Tooltip title="Asistente IA (Copiloto)" placement="left">
          <IconButton 
            onClick={() => setIsOpen(true)}
            sx={{ 
              width: 60, height: 60, 
              background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
              boxShadow: '0 8px 24px rgba(233, 30, 99, 0.4)',
              color: 'white',
              '&:hover': { transform: 'scale(1.05)', background: 'linear-gradient(135deg, #d81b60, #8e24aa)' },
              transition: 'transform 0.2s'
            }}
          >
            <FiCpu size={30} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* El Panel Lateral del Asistente */}
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
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(233, 30, 99, 0.2)'
          }}
        >
          {/* Header del Panel */}
          <Box sx={{ p: 2, background: 'linear-gradient(135deg, #e91e63, #9c27b0)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiCpu size={24} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Copiloto IA</Typography>
            </Box>
            <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <FiX />
            </IconButton>
          </Box>

          {/* Selector de Modo */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #eee' }}>
            <Button 
              fullWidth 
              onClick={() => setMode('proposal')}
              sx={{ 
                borderRadius: 0, 
                py: 1.5, 
                borderBottom: mode === 'proposal' ? '3px solid #e91e63' : '3px solid transparent',
                color: mode === 'proposal' ? '#e91e63' : 'text.secondary',
                fontWeight: mode === 'proposal' ? 'bold' : 'normal'
              }}
            >
              Generar Propuesta
            </Button>
          </Box>

          {/* Contenido del Panel */}
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
                      onChange={e => setProposalInput({ clienteNombre: e.target.value })}
                      InputProps={{ startAdornment: <FiUser style={{ marginRight: 8, color: '#888' }}/> }}
                    />
                    
                    <TextField 
                      label="Nombre de la Empresa" 
                      variant="outlined" 
                      size="small" 
                      fullWidth 
                      value={proposalInput.clienteEmpresa}
                      onChange={e => setProposalInput({ clienteEmpresa: e.target.value })}
                      InputProps={{ startAdornment: <FiBriefcase style={{ marginRight: 8, color: '#888' }}/> }}
                    />

                    <FormControl fullWidth size="small" variant="outlined">
                      <InputLabel id="servicios-label">Servicios a Cotizar</InputLabel>
                      <Select
                        labelId="servicios-label"
                        multiple
                        value={proposalInput.servicios}
                        label="Servicios a Cotizar"
                        onChange={(e) => setProposalInput({ servicios: typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]) })}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" color="primary" />
                            ))}
                          </Box>
                        )}
                      >
                        {serviciosDisponibles.map((serv) => (
                          <MenuItem key={serv} value={serv}>{serv}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField 
                      label="Notas Estratégicas (Opcional)" 
                      placeholder="Ej: El cliente quiere enfocarse en Instagram, el presupuesto es ajustado."
                      variant="outlined" 
                      size="small" 
                      multiline 
                      rows={3} 
                      fullWidth 
                      value={proposalInput.notasAdicionales}
                      onChange={e => setProposalInput({ notasAdicionales: e.target.value })}
                    />

                    <Button 
                      variant="contained" 
                      fullWidth 
                      size="large"
                      onClick={executeGenerateProposal}
                      disabled={!proposalInput.clienteNombre || !proposalInput.clienteEmpresa || proposalInput.servicios.length === 0}
                      sx={{ 
                        mt: 2, 
                        background: 'linear-gradient(135deg, #2196f3, #00bcd4)',
                        fontWeight: 'bold',
                        py: 1.5
                      }}
                      startIcon={<FiZap />}
                    >
                      Magia: Crear Estrategia
                    </Button>
                  </Box>
                ) : isLoading ? (
                  <Stack spacing={2}>
                    <Skeleton variant="text" sx={{ fontSize: '2rem' }} width="80%" />
                    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                  </Stack>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e91e63' }}>
                        ¡Propuesta Generada! ✨
                      </Typography>
                      <Box>
                        <Tooltip title={copied ? "¡Copiado!" : "Copiar al portapapeles"}>
                          <IconButton onClick={handleCopy} color={copied ? "success" : "primary"}>
                            {copied ? <FiCheck /> : <FiCopy />}
                          </IconButton>
                        </Tooltip>
                        <Button size="small" onClick={() => setResultText('')} sx={{ ml: 1 }}>Otra</Button>
                      </Box>
                    </Box>
                    
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        flex: 1, 
                        bgcolor: 'white', 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2,
                        overflowY: 'auto',
                        fontFamily: 'system-ui, sans-serif',
                        '& h1, & h2, & h3': { color: '#1976d2', mt: 2, mb: 1 },
                        '& ul': { pl: 2 }
                      }}
                    >
                      <SafeReactMarkdown>{DOMPurify.sanitize(resultText)}</SafeReactMarkdown>
                    </Paper>
                  </Box>
                )}
              </>
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
