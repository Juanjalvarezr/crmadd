import { useState, useEffect } from 'react';
import { useLoaderData } from 'react-router';
import {
  Box, Paper, Typography, Button, IconButton, Tooltip, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { FiDownload, FiTrash2, FiPlus, FiFileText } from 'react-icons/fi';
import { documentosService } from '../services/supabase';
import { proyectosService } from '../services/database';

export default function Documentos() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openNuevo, setOpenNuevo] = useState(false);
  const [filterProyecto, setFilterProyecto] = useState(() => {
    try { return localStorage.getItem('filtros-documentos-proyecto') || 'all'; } catch { return 'all'; }
  });

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, proyectosData] = await Promise.all([
        documentosService.getAll(),
        proyectosService.getAll()
      ]);
      setDocumentos(data);
      setProyectos(proyectosData);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    try { localStorage.setItem('filtros-documentos-proyecto', filterProyecto); } catch {}
  }, [filterProyecto]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await documentosService.delete(id);
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      setError(e?.message || 'No se pudo eliminar');
    }
  };

  const documentosFiltrados = documentos.filter((doc: any) => {
    const matchProyecto = filterProyecto === 'all' || String(doc.proyecto_id || doc.entidad_id || '') === String(filterProyecto);
    return matchProyecto;
  });

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Documentos</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select size="small" value={filterProyecto} onChange={(e) => setFilterProyecto(String(e.target.value))} sx={{ minWidth: 180 }}>
            <MenuItem value="all">Todos los proyectos</MenuItem>
            {proyectos.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
          </Select>
          <Button variant="contained" startIcon={<FiPlus />} onClick={() => setOpenNuevo(true)}>
            Nuevo documento
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {documentos.length === 0 && (
            <Alert severity="info">No hay documentos generados aún.</Alert>
          )}
          {documentos.map((doc) => (
            <Paper key={doc.id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FiFileText size={22} />
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{doc.titulo || 'Documento sin título'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {doc.entidad_tipo} {doc.entidad_id ? `· ID ${doc.entidad_id}` : ''} · {doc.tipo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(doc.creado_en).toLocaleString()} {doc.usuario ? `· ${doc.usuario}` : ''}
                </Typography>
              </Box>
              <Chip label={doc.tipo} size="small" />
              <Tooltip title="Descargar">
                <IconButton href={doc.url} target="_blank" rel="noreferrer">
                  <FiDownload />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton color="error" onClick={() => handleDelete(doc.id)}>
                  <FiTrash2 />
                </IconButton>
              </Tooltip>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={openNuevo} onClose={() => setOpenNuevo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo documento</DialogTitle>
        <DialogContent divider>
          <Alert severity="info" sx={{ mb: 2 }}>
            Los documentos se generan automáticamente desde las vistas de cliente, proyecto, factura o contrato.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Usá el botón "Generar documento" en cada entidad para crear un PDF y que quede registrado acá.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNuevo(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}