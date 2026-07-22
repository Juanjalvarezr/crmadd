import { useState } from 'react';
import { Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { FiFileText } from 'react-icons/fi';
import { generarYGuardarDocumento } from '../services/pdf';
import type { DocumentoTipo } from '../services/pdf';

interface Props {
  entidadTipo: string;
  entidadId: string;
  tipo: DocumentoTipo;
  titulo?: string;
  usuario?: string;
  domElement: HTMLElement | null;
  label?: string;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

export default function GenerarDocumentoButton({
  entidadTipo,
  entidadId,
  tipo,
  titulo,
  usuario,
  domElement,
  label = 'Generar documento',
  variant = 'outlined',
  size = 'small',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleGenerar = async () => {
    if (!domElement) {
      setError('No se encontró el elemento para generar el PDF.');
      setOpen(true);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await generarYGuardarDocumento({
        entidadTipo,
        entidadId,
        tipo,
        titulo,
        usuario,
        domElement,
      });
      setOk(`Documento generado: ${res.titulo}`);
    } catch (e: any) {
      setError(e?.message || 'Error generando documento');
    } finally {
      setLoading(false);
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FiFileText />}
        onClick={handleGenerar}
        disabled={loading}
      >
        {label}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{ok ? 'Documento listo' : 'Documento'}</DialogTitle>
        <DialogContent divider>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          {ok && <Alert severity="success" sx={{ mb: 1 }}>{ok}</Alert>}
          {!error && !ok && (
            <Alert severity="info">Usá el botón desde la vista correspondiente para generar el PDF.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}