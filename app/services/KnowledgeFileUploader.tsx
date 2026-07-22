import React, { useState } from 'react';
import { 
  Box, Button, Typography, Paper, CircularProgress, 
  LinearProgress, Alert 
} from '@mui/material';
import { FiUpload, FiCheck, FiCamera } from 'react-icons/fi'; //
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { aiService } from '../services/ai';
import { conocimientoService } from '../services/supabase';

// Configuración del worker de PDF.js específica para Vite
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface KnowledgeFileUploaderProps {
  onSuccess?: () => void;
}

export default function KnowledgeFileUploader({ onSuccess }: KnowledgeFileUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Función para extraer texto de un archivo PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
      // Actualizar progreso basado en páginas procesadas
      setProgress(Math.round((i / pdf.numPages) * 100));
    }
    return fullText;
  };

  // Función para extraer texto de una imagen (Tarjeta de presentación / OCR)
  const extractTextFromImage = async (file: File): Promise<string> => {
    const result = await Tesseract.recognize(
      file,
      'spa+eng', // Soporte para español e inglés
      { logger: m => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      }}
    );
    return result.data.text;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    // Validar que sea PDF o Imagen
    if (!isPDF && !isImage) {
      setError("Solo se admiten archivos PDF o imágenes (JPG, PNG) para tarjetas de visita.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // 1. Extraer texto según el tipo de archivo
      setStatus(isPDF ? 'Extrayendo texto del PDF...' : 'Analizando imagen con OCR...');
      const text = isPDF ? await extractTextFromPDF(file) : await extractTextFromImage(file);
      
      if (text.trim().length < 50) {
        throw new Error("El PDF no contiene suficiente texto legible para la IA.");
      }

      // 2. Generar Embedding con Gemini
      setStatus('Generando conocimiento semántico (Embedding)...');
      // Limitamos el texto a 10k caracteres para asegurar el límite de tokens
      const embedding = await aiService.generarEmbedding(text.substring(0, 10000));

      // 3. Guardar en la base de datos de conocimiento
      setStatus('Integrando al cerebro de Deseo Digital...');
      await conocimientoService.create({
        titulo: file.name.replace('.pdf', ''),
        contenido: text,
        categoria: isImage ? 'ventas' : 'marca', // Clasificación inteligente inicial
        embedding: embedding,
        tags: ['pdf-upload', 'marca', 'ia-brain']
      });

      setStatus('¡Conocimiento integrado con éxito!');
      setProgress(100);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error al procesar manual:", err);
      setError(err.message || "Error al procesar el archivo PDF.");
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
          startIcon={loading ? <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /> : <FiCamera />}
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