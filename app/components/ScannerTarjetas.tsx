import React, { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, LinearProgress,
  TextField, Chip, Stack, Alert
} from '@mui/material';
import { FiCamera, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { scanCardFromImage, type ExtractedCard } from '../services/ocrService';
import SafeChip from "../components/SafeChip";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExtractedCard) => void;
}

export default function ScannerTarjetas({ open, onClose, onSave }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<ExtractedCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const process = async (file: File) => {
    setLoading(true);
    setError(null);
    setData(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setPreview(reader.result as string);
        const result = await scanCardFromImage(file);
        setData(result);
      } catch (e: any) {
        setError(e?.message || 'Error al procesar la imagen');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) process(file);
  };

  const handleSave = () => {
    if (data) onSave(data);
  };

  const handleClose = () => {
    setPreview(null);
    setData(null);
    setProgress(0);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Escanear Tarjeta</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!preview && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Seleccioná una foto o tomala con la cámara
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" startIcon={<FiCamera />} onClick={() => fileRef.current?.click()}>
                Cámara
              </Button>
              <Button variant="outlined" startIcon={<FiUpload />} onClick={() => fileRef.current?.click()}>
                Subir imagen
              </Button>
            </Stack>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
          </Box>
        )}

        {preview && (
          <Box sx={{ mb: 2 }}>
            <Box
              component="img"
              src={preview}
              sx={{ width: '100%', borderRadius: 1, maxHeight: 260, objectFit: 'cover' }}
            />
          </Box>
        )}

        {loading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">Procesando OCR…</Typography>
            <LinearProgress variant="indeterminate" />
          </Box>
        )}

        {data && !loading && (
          <Stack spacing={1.2} sx={{ mt: 1 }}>
            <TextField label="Nombre" fullWidth value={data.nombre || ''} onChange={(e) => setData({ ...data, nombre: e.target.value })} />
            <TextField label="Empresa" fullWidth value={data.empresa || ''} onChange={(e) => setData({ ...data, empresa: e.target.value })} />
            <TextField label="Teléfono" fullWidth value={data.telefono || ''} onChange={(e) => setData({ ...data, telefono: e.target.value })} />
            <TextField label="Email" fullWidth value={data.email || ''} onChange={(e) => setData({ ...data, email: e.target.value })} />
            <TextField label="Dirección" fullWidth value={data.direccion || ''} onChange={(e) => setData({ ...data, direccion: e.target.value })} />
            <TextField label="Redes" fullWidth value={(data.redes || []).join(', ')} onChange={(e) => setData({ ...data, redes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <SafeChip label={`${(data.texto || '').split(/\r?\n/).length} líneas detectadas`} color="info" variant="outlined" />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} startIcon={<FiX />}>Cancelar</Button>
        {data && !loading && (
          <Button variant="contained" onClick={handleSave} startIcon={<FiCheck />}>Guardar Cliente</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
