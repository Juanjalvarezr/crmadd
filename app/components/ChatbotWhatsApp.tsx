import React from "react";
import { IconButton, Tooltip, Snackbar, Alert } from "@mui/material";
import { FiMessageSquare } from "react-icons/fi";

export default function ChatbotWhatsApp() {
  const numero = (import.meta as any)?.env?.VITE_WHATSAPP_NUMBER || "+573000000000";
  const link = `https://wa.me/${numero.replace(/[^\d]/g, '')}?text=Hola%20DESEO%20DIGITAL`;

  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Tooltip title="Abrir WhatsApp">
        <IconButton
          onClick={() => window.open(link, '_blank')}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#25D366',
            color: 'white',
            width: 56,
            height: 56,
            zIndex: 1300,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            '&:hover': { bgcolor: '#1da851' },
          }}
        >
          <FiMessageSquare size={26} />
        </IconButton>
      </Tooltip>
      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" onClose={() => setOpen(false)}>WhatsApp se abrió en una nueva pestaña</Alert>
      </Snackbar>
    </>
  );
}
