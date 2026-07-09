import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, TextField, List, ListItem, ListItemText, 
  ListItemIcon, Typography, Box, InputAdornment, Chip, Divider 
} from '@mui/material';
import { FiSearch, FiUser, FiFolder, FiCheckSquare, FiZap, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router'; // Hook de React Router
import { tareasService } from '../services/supabase'; // Mantener servicios no modularizados
import { clientesService } from '../services/clientesService'; // Importar desde el nuevo módulo
import { proyectosService } from '../services/proyectosService'; // Importar desde el nuevo módulo

export default function GlobalSearch({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResultados] = useState<{tipo: string, nombre: string, id: string, path: string}[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const performSearch = async () => {
      if (query.length < 2) {
        setResultados([]);
        return;
      }

      const [clis, proys, tasks] = await Promise.all([
        clientesService.getAll(),
        proyectosService.getAll(),
        tareasService.getAll()
      ]);

      const filtered = [
        ...clis.filter(c => c.nombre.toLowerCase().includes(query.toLowerCase()))
          .map(c => ({ tipo: 'Cliente', nombre: c.nombre, id: String(c.id), path: '/clientes' })),
        ...proys.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase()))
          .map(p => ({ tipo: 'Proyecto', nombre: p.nombre, id: p.id, path: '/proyectos' })),
        ...tasks.filter(t => t.titulo.toLowerCase().includes(query.toLowerCase()))
          .map(t => ({ tipo: 'Tarea', nombre: t.titulo, id: String(t.id), path: '/tareas' }))
      ];

      setResultados(filtered.slice(0, 8)); // Mostrar solo top 8
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: any) => {
    navigate(item.path);
    onClose();
    setQuery('');
  };

  const quickActions = [
    { nombre: 'Nuevo Cliente', path: '/clientes?action=new', icono: <FiPlus />, color: '#e91e63' },
    { nombre: 'Nueva Tarea', path: '/tareas?action=new', icono: <FiCheckSquare />, color: '#4caf50' },
    { nombre: 'Nueva Venta', path: '/ventas?action=new', icono: <FiZap />, color: '#ff9800' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee', bgcolor: '#fafafa' }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Busca clientes, proyectos o tareas... (Esc para salir)"
            variant="standard"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              disableUnderline: true,
              startAdornment: <InputAdornment position="start"><FiSearch color="#e91e63" /></InputAdornment>,
              sx: { fontSize: '1.2rem' }
            }}
          />
        </Box>
        <List sx={{ pt: 0, pb: 1 }}>
          {query.length < 2 && (
            <>
              <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
                ACCIONES RÁPIDAS
              </Typography>
              {quickActions.map((action, i) => (
                <ListItem button key={i} onClick={() => handleSelect(action as any)}>
                  <ListItemIcon sx={{ color: action.color }}>{action.icono}</ListItemIcon>
                  <ListItemText primary={action.nombre} />
                  <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, borderRadius: 1 }}>Enter</Typography>
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
          {results.length > 0 ? (
            results.map((item, index) => (
              <ListItem 
                button 
                key={index} 
                onClick={() => handleSelect(item)}
                sx={{ '&:hover': { bgcolor: '#fce4ec' } }}
              >
                <ListItemIcon>
                  {item.tipo === 'Cliente' ? <FiUser /> : item.tipo === 'Proyecto' ? <FiFolder /> : <FiCheckSquare />}
                </ListItemIcon>
                <ListItemText 
                  primary={item.nombre} 
                  secondary={<Chip label={item.tipo} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />} 
                />
                <FiZap size={14} color="#ddd" />
              </ListItem>
            ))
          ) : query.length > 1 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No encontramos nada relacionado con "{query}"</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Escribe al menos 2 letras para empezar a buscar...</Typography>
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}