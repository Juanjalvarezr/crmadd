import React, { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, LinearProgress,
  TextField, Chip, Stack, Alert
} from '@mui/material';
import { FiCamera, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { supabase, clientesService, interaccionesService } from '../services/supabase';
import { globalSnack } from '../components/GlobalSnackbar';

// OCR temporalmente deshabilitado
interface ExtractedCard {
  nombre?: string;
  empresa?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  redes?: string[];
  web?: string;
  texto?: string;
}

const fileToBase64 = async (file: File): Promise<string> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = dataUrl; });
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl.split(',')[1] || '';
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.75).split(',')[1] || '';
  } catch {
    return dataUrl.split(',')[1] || '';
  }
};

const scanCardFromImage = async (file: File): Promise<ExtractedCard> => {
  const imageBase64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { action: 'extractCard', imageBase64, mimeType: file.type || 'image/jpeg' },
  });
  if (error) throw new Error(error.message || 'Error llamando a la IA');
  const d = (data?.data || data || {}) as Record<string, any>;
  return {
    nombre: d.nombre || undefined,
    empresa: d.empresa || undefined,
    telefono: d.telefono || d.whatsapp || undefined,
    email: d.email || undefined,
    direccion: d.direccion || undefined,
    web: d.web || undefined,
    redes: Array.isArray(d.redes) ? d.redes : [],
    texto: d.texto || '',
  };
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExtractedCard) => void;
}

export default function ScannerTarjetas({ open, onClose, onSave }: Props) {
    const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractedCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const process = async (file: File) => {
    setLoading(true);
    setError(null);
    setData(null);

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

  const handleSave = async () => {
    if (!data) return;
    try {
      const cliente = await clientesService.create({
        nombre: data.nombre || 'Sin nombre',
        email: data.email || '',
        telefono: data.telefono || '',
        empresa: data.empresa || '',
        estado: 'Activo',
      });

      if (cliente?.id) {
        await interaccionesService.create({
          cliente_id: cliente.id,
          tipo: 'Nota',
          asunto: 'OCR - Tarjeta escaneada',
          contenido: `Datos extraídos: ${data.texto || ''}`,
          usuario: 'Asistente IA',
        });
      }

      globalSnack.show('Cliente guardado desde OCR', 'success');
      onSave(data);
      handleClose();
    } catch (e: any) {
      globalSnack.show(e?.message || 'Error guardando cliente OCR', 'error');
    }
  };

  const handleClose = () => {
    setPreview(null);
    setData(null);
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
            <TextField label="Web" fullWidth value={data.web || ''} onChange={(e) => setData({ ...data, web: e.target.value })} />
            <TextField label="Redes" fullWidth value={(data.redes || []).join(', ')} onChange={(e) => setData({ ...data, redes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <Chip label={`${(data.texto || '').split(/\r?\n/).length} líneas detectadas`} color="info" variant="outlined" />
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
