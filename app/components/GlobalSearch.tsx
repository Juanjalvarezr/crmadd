import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, List, ListItem, ListItemText,
  ListItemIcon, Typography, Box, InputAdornment, Chip, Divider, alpha,
  Paper, Tabs, Tab, CircularProgress
} from '@mui/material';
import { FiSearch, FiUser, FiFolder, FiCheckSquare, FiZap, FiPlus, FiFileText, FiMail, FiTrendingUp, FiTarget, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { clientesService } from '../services/database';
import { proyectosService } from '../services/database';
import { tareasService } from '../services/database';
import { oportunidadesService } from '../services/database';
import { facturasService, contratosService } from '../services/facturacion';
import SafeChip from "../components/SafeChip";

export default function GlobalSearch({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tipo: string, nombre: string, id: string, path: string, sub?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); return; }
  }, [open]);

  useEffect(() => {
    const performSearch = async () => {
      if (query.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const [clis, proys, facs, conts, tareas, oportunidades] = await Promise.all([
          clientesService.getAll(),
          proyectosService.getAll(),
          facturasService.getAll(),
          contratosService.getAll(),
          tareasService.getAll(),
          oportunidadesService.getAll()
        ]);
        const q = query.toLowerCase();
        const filtered = [
          ...clis.filter((c: any) => (c.nombre || '').toLowerCase().includes(q) || (c.empresa || '').toLowerCase().includes(q))
            .map((c: any) => ({ tipo: 'Cliente', nombre: c.nombre || c.empresa, id: String(c.id), path: `/clientes/${c.id}`, sub: c.nicho })),
          ...proys.filter((p: any) => (p.nombre || '').toLowerCase().includes(q))
            .map((p: any) => ({ tipo: 'Proyecto', nombre: p.nombre, id: String(p.id), path: `/proyectos/${p.id}`, sub: p.estado })),
          ...facs.filter((f: any) => ((f.numero || String(f.id)) + ' ' + (f.estado || '')).toLowerCase().includes(q))
            .map((f: any) => ({ tipo: 'Factura', nombre: `#${f.numero || f.id}`, id: String(f.id), path: `/facturacion`, sub: f.estado })),
          ...conts.filter((c: any) => ((c.titulo || '') + ' ' + (c.estado || '')).toLowerCase().includes(q))
            .map((c: any) => ({ tipo: 'Contrato', nombre: c.titulo || `#${c.id}`, id: String(c.id), path: `/contratos`, sub: c.estado })),
          ...tareas.filter((t: any) => (t.titulo || '').toLowerCase().includes(q))
            .map((t: any) => ({ tipo: 'Tarea', nombre: t.titulo, id: String(t.id), path: `/tareas`, sub: t.estado })),
          ...oportunidades.filter((o: any) => (o.nombre || '').toLowerCase().includes(q))
            .map((o: any) => ({ tipo: 'Oportunidad', nombre: o.nombre, id: String(o.id), path: `/ventas`, sub: o.etapa })),
        ];
        setResults(filtered.slice(0, 15));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(performSearch, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose?.();
        setTimeout(() => {
          const el = document.getElementById('global-search-trigger');
          el?.click();
        }, 10);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = (item: any) => {
    navigate(item.path);
    onClose?.();
    setQuery('');
  };

  const quickActions = [
    { nombre: 'Nuevo Cliente', path: '/clientes?action=new', icono: <FiPlus />, color: '#e91e63' },
    { nombre: 'Nueva Tarea', path: '/tareas?action=new', icono: <FiCheckSquare />, color: '#4caf50' },
    { nombre: 'Nueva Venta', path: '/ventas?action=new', icono: <FiZap />, color: '#ff9800' },
    { nombre: 'Nuevo Proyecto', path: '/proyectos?action=new', icono: <FiFolder />, color: '#2196f3' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: { xs: 'none', sm: 'block' } }}>Buscador global</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Busca clientes, proyectos, facturas, contratos... (Esc)"
            variant="standard"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              disableUnderline: true,
              startAdornment: <InputAdornment position="start"><FiSearch color="#e91e63" /></InputAdornment>,
              sx: { fontSize: { xs: '1rem', sm: '1.2rem' } }
            }}
          />
        </Box>
        <List sx={{ pt: 0, pb: 1, maxHeight: 360, overflowY: 'auto' }}>
          {query.length < 2 && (
            <>
              <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
                ACCIONES RÁPIDAS
              </Typography>
              {quickActions.map((action, i) => (
                <ListItem button key={i} onClick={() => handleSelect(action as any)}>
                  <ListItemIcon sx={{ color: action.color }}>{action.icono}</ListItemIcon>
                  <ListItemText primary={action.nombre} />
                  <Chip label={i === 0 ? 'Cmd K' : i === 1 ? 'F1' : i === 2 ? 'F2' : 'F3'} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />
                </ListItem>
              ))}
              <Divider sx={{ my: 1 }} />
            </>
          )}
          {results.length > 0 && (
            <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
              RESULTADOS
            </Typography>
          )}
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : results.length > 0 ? (
            results.map((item, index) => (
              <ListItem button key={index} onClick={() => handleSelect(item)} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemIcon>
                  {item.tipo === 'Cliente' ? <FiUser /> : 
                   item.tipo === 'Proyecto' ? <FiFolder /> : 
                   item.tipo === 'Factura' ? <FiFileText /> : 
                   item.tipo === 'Contrato' ? <FiMail /> :
                   item.tipo === 'Tarea' ? <FiCheckSquare /> :
                   item.tipo === 'Oportunidad' ? <FiTarget /> : <FiSearch />}
                </ListItemIcon>
                <ListItemText
                  primary={item.nombre}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.2 }}>
                      <SafeChip label={item.tipo} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                      {item.sub && <Typography variant="caption" color="text.secondary">{item.sub}</Typography>}
                    </Box>
                  }
                />
              </ListItem>
            ))
          ) : query.length > 1 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No encontramos nada con "{query}"</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Escribe al menos 2 letras para buscar...</Typography>
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}