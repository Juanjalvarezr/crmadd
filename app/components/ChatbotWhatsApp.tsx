import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  Box, TextField, Button, Paper, Typography, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Chip, CircularProgress, Tooltip, Snackbar, Alert
} from "@mui/material"; //
import { 
  FiSend, FiMessageSquare, FiX, FiZap, FiUserCheck, FiMic, FiCalendar, FiMail, FiMapPin, FiPhone, FiAlertTriangle
} from "react-icons/fi"; //
import { aiService } from "../services/ai";
import { supabase } from "../services/database";
import DOMPurify from "dompurify";
import { useChatStore } from "../store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";

interface OpcionRapida {
  id: string;
  texto: string;
  icono: React.ReactNode;
  accion: () => void;
}

export default function ChatbotWhatsApp() {
  // Store Global
  // Uso de selectores para evitar re-renders innecesarios
  const mensajes = useChatStore((state) => state.mensajes);
  const addMensaje = useChatStore((state) => state.addMensaje);

  // Solución para Hydration Mismatch en SSR
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Estados locales de UI
  const [mensajeActual, setMensajeActual] = useState("");
  const [qrVisible, setQrVisible] = useState(true);
  const [conectado, setConectado] = useState(false); //
  const [isProcessingAIResponse, setIsProcessingAIResponse] = useState(false); //
  const [chatAbierto, setChatAbierto] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: "info" | "warning" | "error" | "success"}>({ open: false, message: "", severity: "info" });
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Punto 7: Selección de Agente/Rol
  const [selectedRole, setSelectedRole] = useState({
    slug: "business_architect_cfo_chat",
    label: "Aliado Estratégico (CFO)",
    color: "#e91e63"
  });

  // QR Code para conexión
  const numeroWhatsApp = import.meta.env.VITE_WHATSAPP_NUMBER || "+573203698476"; 
  const qrValue = `https://wa.me/${numeroWhatsApp.replace(/[^\d]/g, '')}`;
  const qrCanvas = useRef<HTMLCanvasElement>(null);

  // Generar QR Code
  useEffect(() => {
    const generateQR = async () => {
      if (qrCanvas.current && qrVisible && isHydrated) {
        const canvas = qrCanvas.current;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          try {
            const QRCodeModule = await import("qrcode");
            const QRCode = QRCodeModule.default || QRCodeModule;
            await (QRCode as any).toCanvas(canvas, qrValue, {
              width: 200,
              margin: 2,
              color: {
                dark: "#e91e63",
                light: "#ffffff"
              }
            });
          } catch (error) {
            console.error("Error generando QR:", error);
          }
        }
      }
    };

    void generateQR();
  }, [qrVisible]);

  // Auto-scroll al final de mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Saludo Inicial Personalizado para Juan José
  useEffect(() => {
    if (chatAbierto && mensajes.length === 0) {
      addMensaje(`¡Hola Juan José! Soy tu ${selectedRole.label}. Estoy listo para analizar los procesos de DESEO DIGITAL. ¿Qué tenemos en mente hoy?`, 'bot');
    }
  }, [chatAbierto, mensajes.length, selectedRole.label, addMensaje]);

  // Punto 6: Realtime Listeners
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setSnackbar({
            open: true,
            message: `🚀 Proyecto "${payload.new.nombre}" actualizado en tiempo real`,
            severity: "info"
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Lógica de Reconocimiento de Voz
  const handleStartListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta comandos de voz. Prueba con Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.onstart = () => setEscuchando(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMensajeActual(transcript);
    };
    recognition.onerror = () => setEscuchando(false);
    recognition.onend = () => setEscuchando(false);
    recognition.start();
  };

  // Opciones rápidas predefinidas
  const opcionesRapidas: OpcionRapida[] = useMemo(() => [
    {
      id: "servicios",
      texto: "¿Qué servicios ofrecen?",
      icono: <FiMessageSquare />,
      accion: () => setMensajeActual("Hola, me gustaría conocer los servicios que ofrecen para mi negocio.")
    },
    {
      id: "precios",
      texto: "¿Cuáles son los precios?",
      icono: <FiMail />,
      accion: () => setMensajeActual("¿Podrían enviarme su lista de precios por favor?")
    },
    {
      id: "cita",
      texto: "Agendar una cita",
      icono: <FiCalendar />,
      accion: () => setMensajeActual("Me gustaría agendar una cita para hablar sobre sus servicios. ¿Qué fechas tienen disponibles?")
    },
    {
      id: "ubicacion",
      texto: "¿Dónde están ubicados?",
      icono: <FiMapPin />,
      accion: () => setMensajeActual("¿Podrían compartir su dirección para visitarlos? Quisiera conocer más sobre su ubicación.")
    },
    {
      id: "contacto",
      texto: "Hablar con un humano",
      icono: <FiPhone />,
      accion: () => setMensajeActual("¿Podría hablar con un representante humano por favor? Tengo una consulta específica.")
    },
    {
      id: "reportar",
      texto: "Reportar un fallo",
      icono: <FiAlertTriangle />,
      accion: () => setMensajeActual("Hola IA, quiero reportar que falta una funcionalidad o hay un error en esta pantalla: ")
    }
  ], []);

  // Función para enviar mensaje
  const processMessageSubmission = useCallback(async (overrideText?: string) => {
    const textToSend = overrideText || mensajeActual;
    if (!textToSend.trim()) return;

    // Sanitización de entrada para evitar XSS
    const sanitizedInput = DOMPurify.sanitize(textToSend.trim());
    
    if (!sanitizedInput) return;

    if (sanitizedInput.length > 1000) {
      setSnackbar({
        open: true,
        message: "El mensaje es demasiado largo (máximo 1000 caracteres)",
        severity: "warning"
      });
      return;
    }

    addMensaje(sanitizedInput, "usuario");
    if (!overrideText) setMensajeActual("");

    // Respuesta real usando IA
    setIsProcessingAIResponse(true); //
    try {
      const respuestaAI = await aiService.chatConDatosReales(sanitizedInput, selectedRole.slug);

      // Aseguramos que la respuesta no esté vacía
      const textoFinal = typeof respuestaAI === 'string' ? respuestaAI : "Lo siento, no pude procesar tu solicitud.";
      addMensaje(textoFinal, "bot");

      const lowerResp = textoFinal.toLowerCase();
      if (lowerResp.includes("ejecutado") || lowerResp.includes("guardado")) {
        setSnackbar({
          open: true,
          message: "⚙️ Acción del sistema procesada con éxito",
          severity: "success"
        });
      }
    } catch (error) {
      console.error("Error AI Bot:", error);
    } finally {
      setIsProcessingAIResponse(false); //
    }
  }, [mensajeActual, selectedRole.slug, addMensaje]);

  // Cambiar de agente y reiniciar saludo
  const handleChangeRole = useCallback((slug: string, label: string, color: string) => {
    setSelectedRole({ slug, label, color });
    addMensaje(`Cambiando de frecuencia... Ahora hablas con el **${label}**. ¿En qué puedo ayudarte bajo este rol?`, "bot");
    setSnackbar({ open: true, message: `Agente: ${label} activo`, severity: "info" });
  }, [addMensaje]);

  // Función para manejar opción rápida
  const handleOpcionRapida = useCallback((opcion: OpcionRapida) => {
    void processMessageSubmission(opcion.texto);
  }, [processMessageSubmission]);

  // Función para conectar WhatsApp
  const handleConectarWhatsApp = useCallback(() => {
    setConectado(true);
    setQrVisible(false);
    setChatAbierto(true);
    
    // Si el usuario ya escribió algo antes de conectar, lo llevamos a WA con ese mensaje
    if (mensajeActual.trim()) {
      const url = aiService.prepararEnlaceWhatsApp(numeroWhatsApp, mensajeActual);
      window.open(url, '_blank');
      return;
    }

    // Si no, simplemente abrimos el chat vacío
    window.open(`https://web.whatsapp.com/send?phone=${encodeURIComponent(numeroWhatsApp)}`, '_blank');
  }, [mensajeActual, numeroWhatsApp]);

  // Función para formatear hora
  const formatearHora = React.useCallback((timestamp: string | number | Date) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? "" : date.toLocaleTimeString('es-CO', {
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  if (!isHydrated) return null; // No renderizar hasta que el store esté listo

  return (
    <>
      {/* Icono Flotante 3D */}
      {!chatAbierto && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            zIndex: 1000,
          }}
        >
          <IconButton
            onClick={() => setChatAbierto(true)}
            sx={{
              width: 70,
              height: 70,
              bgcolor: '#e91e63',
              color: 'white',
              boxShadow: '0 10px 25px rgba(233, 30, 99, 0.4), inset 0 -4px 0 rgba(0,0,0,0.2)',
              border: '2px solid rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: '#c2185b' }
            }}
          >
            <FiZap size={32} />
          </IconButton>
        </motion.div>
      )}

      <AnimatePresence>
        {chatAbierto && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            style={{
              position: 'fixed',
              bottom: 30,
              right: 30,
              width: isMobile ? '90vw' : 400,
              height: 600,
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Paper 
              elevation={10}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid rgba(233, 30, 99, 0.1)'
              }}
            >
      {/* Header */}
      <Paper sx={{ 
        p: 2, 
        backgroundColor: "#e91e63", 
        color: "white",
        boxShadow: 2
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FiUserCheck size={24} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {selectedRole.label}
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {conectado && (
              <Chip 
                label="Conectado" 
                size="small" 
                sx={{ backgroundColor: "#4caf50", color: "white" }}
              />
            )}
            <Tooltip title="Cerrar chat">
              <IconButton onClick={() => setChatAbierto(false)} sx={{ color: "white" }}>
                <FiX />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="body2">
          Hola, Juan José Álvarez (CEO)
        </Typography>
      </Paper>
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, bgcolor: '#f8f9fa', overflow: 'hidden' }}>
              {/* Selector de Agentes */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 1 }}>
                <Chip 
                  label="Socio CFO" 
                  onClick={() => handleChangeRole("business_architect_cfo_chat", "Aliado Estratégico (CFO)", "#e91e63")}
                  variant={selectedRole.slug === "business_architect_cfo_chat" ? "filled" : "outlined"}
                  sx={{ bgcolor: selectedRole.slug === "business_architect_cfo_chat" ? "#e91e63" : "transparent", color: selectedRole.slug === "business_architect_cfo_chat" ? "white" : "inherit" }}
                />
                <Chip 
                  label="Director Estratégico" 
                  onClick={() => handleChangeRole("director_estrategico_propuesta", "Director Estratégico", "#2196f3")}
                  variant={selectedRole.slug === "director_estrategico_propuesta" ? "filled" : "outlined"}
                />
                <Chip 
                  label="Content Lead" 
                  onClick={() => handleChangeRole("content_lead_plan_contenido", "Content Lead (Asistente IA)", "#9c27b0")}
                  variant={selectedRole.slug === "content_lead_plan_contenido" ? "filled" : "outlined"}
                />
              </Box>

              <Box sx={{ 
                flex: 1, 
                overflowY: "auto", 
                mb: 2,
                p: 1,
                backgroundColor: "#fafafa",
                borderRadius: 1
              }}>
                {mensajes.map((mensaje, index) => (
                  <Box key={mensaje.id} sx={{ mb: 2 }}>
                    <Box sx={{ 
                      display: "flex", 
                      justifyContent: mensaje.tipo === "usuario" ? "flex-end" : "flex-start",
                      alignItems: "flex-start",
                      gap: 1
                    }}>
                      {mensaje.tipo === "bot" && (
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: "#e91e63" }}>
                          <FiMessageSquare size={16} color="white" />
                        </Avatar>
                      )}
                      
                      <Box sx={{ 
                        maxWidth: "70%",
                        p: 2,
                        backgroundColor: mensaje.tipo === "usuario" ? "#e91e63" : "#f0f0f0",
                        borderRadius: 2,
                        border: `1px solid ${mensaje.tipo === "usuario" ? "#e91e63" : "#e0e0e0"}`
                      }}>
                        <Typography variant="body2" sx={{ wordBreak: "break-word", color: mensaje.tipo === "usuario" ? "white" : "inherit" }}>
                          {mensaje.texto}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="caption" sx={{ 
                      textAlign: mensaje.tipo === "usuario" ? "right" : "left",
                      mt: 0.5,
                      color: "#999"
                    }}>
                      {formatearHora(mensaje.timestamp)}
                    </Typography>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Área de Escritura */}
              <Box sx={{ 
                p: 2, 
                borderTop: "1px solid #e0e0e0", 
                backgroundColor: "#fafafa"
              }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {isProcessingAIResponse && ( //
                    <CircularProgress size={20} sx={{ color: "#e91e63" }} />
                  )}
                  <IconButton 
                    onClick={handleStartListening}
                    sx={{ color: escuchando ? "#4caf50" : "#e91e63" }}
                  >
                    {escuchando ? <CircularProgress size={24} color="success" /> : <FiMic />}
                  </IconButton>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={2}
                    placeholder="Escribe tu mensaje..."
                    value={mensajeActual}
                    onChange={(e) => setMensajeActual(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        processMessageSubmission();
                      }
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <IconButton 
                    onClick={() => processMessageSubmission()}
                    disabled={!mensajeActual.trim() || isProcessingAIResponse} //
                    sx={{ 
                      backgroundColor: "#e91e63", 
                      color: "white",
                      '&:hover': { backgroundColor: "#c2185b" },
                      '&:disabled': { backgroundColor: "#ccc" }
                    }}
                  >
                    <FiSend />
                  </IconButton>
                </Box>
              </Box>
            </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
