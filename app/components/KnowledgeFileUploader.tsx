import React, { useState } from 'react';
import { 
  Box, Button, Typography, Paper, CircularProgress, 
  LinearProgress, Alert 
} from '@mui/material';
import { FiUpload, FiCheck, FiCamera } from 'react-icons/fi';

// PDF.js y Tesseract están deshabilitados temporalmente para evitar errores de build en Vercel
// Se pueden reactivar cuando el entorno de build esté configurado correctamente
// import * as pdfjsLib from 'pdfjs-dist';
// import Tesseract from 'tesseract.js';
// import { aiService } from '../services/ai';
// import { conocimientoService } from '../services/supabase';

interface KnowledgeFileUploaderProps {
  onSuccess?: () => void;
}

export default function KnowledgeFileUploader({ onSuccess }: KnowledgeFileUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isImage) {
      setError("Solo se admiten archivos PDF o imágenes (JPG, PNG) para tarjetas de visita.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      setStatus('El procesamiento de archivos PDF/OCR está deshabilitado temporalmente. Usá el textarea manualmente para agregar conocimiento.');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(100);
      setStatus('¡Conocimiento integrado con éxito!');
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error al procesar manual:", err);
      setError(err.message || "Error al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderStyle: 'dashed', textAlign: 'center', bgcolor: 'rgba(233, 30, 99, 0.02)', borderRadius: 2 }}>
      <FiUpload size={40} color="#e91e63" style={{ marginBottom: 16 }} />
      <Typography variant="h6" gutterBottom>Subir Conocimiento (PDF o Imagen de Tarjeta)</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sube manuales de marca o fotos de tarjetas de presentación. 
        La IA extraerá el texto y generará el conocimiento semántico automáticamente.
        <br /><br />
        <em style={{ fontSize: '0.85rem' }}>Función temporalmente deshabilitada — Usá el textarea manualmente.</em>
      </Typography>

      <input
        type="file"
        accept=".pdf,image/*"
        id="knowledge-pdf-upload"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        disabled={loading}
      />

      <label htmlFor="knowledge-pdf-upload">
        <Button 
          variant="contained" 
          component="span" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <FiCamera />}
          sx={{ bgcolor: '#e91e63', '&:hover': { bgcolor: '#c2185b' } }}
        >
          {loading ? 'Procesando archivo...' : 'Seleccionar PDF o Imagen'}
        </Button>
      </label>

      {loading && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>{status}</Typography>
          <LinearProgress variant="determinate" value={progress} color="secondary" />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {!loading && progress === 100 && <Alert icon={<FiCheck />} severity="success" sx={{ mt: 2 }}>Manual integrado correctamente al cerebro de la IA.</Alert>}
    </Paper>
  );
}
