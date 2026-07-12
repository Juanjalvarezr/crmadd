import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Stepper, Step, StepLabel, Chip, Paper, Alert, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { FiUser, FiFolder, FiCheckSquare, FiMessageSquare, FiBarChart } from 'react-icons/fi';

const steps = [
  { title: 'Bienvenido a DESEO DIGITAL', desc: 'Este es tu CRM inteligente. Vamos a configurarlo en 4 pasos.', icon: <FiUser size={28} /> },
  { title: 'Explora las rutas', desc: 'Clientes, Proyectos, Facturación, Contratos, Calendario y más.', icon: <FiFolder size={28} /> },
  { title: 'Crea tu primera tarea', desc: 'Usa el botón flotante o presiona Cmd+K para búsqueda global.', icon: <FiCheckSquare size={28} /> },
  { title: 'Conecta WhatsApp', desc: 'Desde cada cliente o proyecto puedes abrir una conversación directa.', icon: <FiMessageSquare size={28} /> },
];

export function OnboardingTour({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (open) {
      const visited = localStorage.getItem('onboarding_completed');
      if (!visited) {
        setActiveStep(0);
      } else {
        onClose();
      }
    }
  }, [open, onClose]);

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      localStorage.setItem('onboarding_completed', 'true');
      onClose();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleSkip} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>{steps[activeStep].icon}</Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{steps[activeStep].title}</Typography>
        <Chip label={`Paso ${activeStep + 1} de ${steps.length}`} size="small" sx={{ mt: 1 }} />
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>{steps[activeStep].desc}</Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
          {steps.map((step) => (
            <Step key={step.title}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {activeStep === 1 && (
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <List dense>
              {['/clientes', '/proyectos', '/ventas', '/tareas', '/facturacion', '/contratos', '/calendario', '/whatsapp', '/reportes'].map((ruta) => (
                <ListItem key={ruta}>
                  <ListItemText primary={ruta} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
        {activeStep === 2 && (
          <Alert severity="info" sx={{ mt: 1 }}>Abre el chat IA con el botón inferior derecho o usa Cmd+K para buscar.</Alert>
        )}
        {activeStep === 3 && (
          <Alert severity="success" sx={{ mt: 1 }}>WhatsApp está disponible desde cada cliente y proyecto.</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'space-between' }}>
        <Button onClick={handleSkip}>Omitir</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleNext}>{activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
