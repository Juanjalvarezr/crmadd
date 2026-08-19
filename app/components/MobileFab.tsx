import React, { useState, useEffect } from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Stack } from '@mui/material';
import { FiUsers, FiCheckSquare, FiTrendingUp, FiPlus, FiX, FiMessageSquare, FiSave } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { tareasService, oportunidadesService, interaccionesService } from '../services/supabase';
import { useCRMStore } from '../store/useCRMStore';
import { useNotificationStore } from '../store/useNotificationStore';

type ActionType = 'tarea' | 'oportunidad' | 'interaccion';

export const MobileFab: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>('tarea');
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('Tarea');
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();
  const clientesStore = useCRMStore((s) => s.clientes);
  const fetchClientes = useCRMStore((s) => s.fetchClientes);
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (clientesStore.length === 0) {
      fetchClientes().then(() => {
        const list = useCRMStore.getState().clientes;
        setClientes(list || []);
      }).catch(() => {});
    } else {
      setClientes(clientesStore || []);
    }
  }, [clientesStore, fetchClientes]);

  const acciones = [
    { icon: <FiCheckSquare size={20} />, name: 'Nueva Tarea', type: 'tarea' as ActionType },
    { icon: <FiTrendingUp size={20} />, name: 'Nueva Venta', type: 'oportunidad' as ActionType },
    { icon: <FiMessageSquare size={20} />, name: 'Registrar Gestión', type: 'interaccion' as ActionType },
    { icon: <FiUsers size={20} />, name: 'Ver Clientes', path: '/clientes' },
  ];

  const abrirForm = (tipo: ActionType) => {
    setActionType(tipo);
    setTitulo('');
    setDescripcion('');
    setValor('');
    setTipo('Tarea');
    setSelectedCliente(clientes[0]?.id ? String(clientes[0].id) : '');
    setFormOpen(true);
    setOpen(false);
  };

  const handleSave = async () => {
    try {
      setGuardando(true);
      const clienteId = Number(selectedCliente);
      if (!clienteId) {
        showNotification('Seleccioná un cliente', 'warning');
        setGuardando(false);
        return;
      }

      if (actionType === 'tarea') {
        if (!titulo.trim()) {
          showNotification('Título requerido', 'warning');
          setGuardando(false);
          return;
        }
        await tareasService.create({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fecha: new Date().toISOString().slice(0, 10),
          prioridad: 'Media',
          estado: 'Pendiente',
          tipo: tipo as any,
          cliente_id: clienteId,
        });
        showNotification('Tarea creada', 'success');
      } else if (actionType === 'oportunidad') {
        if (!titulo.trim()) {
          showNotification('Título requerido', 'warning');
          setGuardando(false);
          return;
        }
        await oportunidadesService.create({
          nombre: titulo.trim(),
          cliente_id: clienteId,
          cliente_nombre: clientes.find((c) => c.id === clienteId)?.nombre || '',
          valor: Number(valor) || 0,
          servicios_interes: [],
          etapa: 'Prospección',
          estado: 'Abierta',
          probabilidad: 25,
        });
        showNotification('Oportunidad creada', 'success');
      } else if (actionType === 'interaccion') {
        if (!descripcion.trim()) {
          showNotification('Descripción requerida', 'warning');
          setGuardando(false);
          return;
        }
        await interaccionesService.create({
          cliente_id: clienteId,
          tipo: ['Cita','Email','WhatsApp','Nota'].includes(tipo) ? (tipo as "Cita" | "Email" | "WhatsApp" | "Nota") : 'Nota',
          asunto: titulo.trim() || 'Gestión',
          contenido: descripcion.trim(),
          usuario: 'Asistente IA',
        });
        showNotification('Gestión registrada en historial', 'success');
      }

      setFormOpen(false);
    } catch (e: any) {
      showNotification(e?.message || 'Error guardando', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <SpeedDial
        ariaLabel="Acciones rápidas"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          zIndex: 1400,
          '& .MuiSpeedDial-fab': {
            backgroundColor: '#e91e63',
            '&:hover': { backgroundColor: '#c2185b' }
          }
        }}
        icon={<SpeedDialIcon icon={<FiPlus size={24} />} openIcon={<FiPlus style={{ transform: 'rotate(45deg)' }} size={24} />} />}
      >
        {acciones.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            title={action.name}
            onClick={() => {
              if ('path' in action) {
                navigate(action.path as string);
                setOpen(false);
              } else {
                abrirForm(action.type);
              }
            }}
            sx={{ backgroundColor: '#fff', color: '#e91e63', '&:hover': { backgroundColor: '#f5f5f5' } }}
          />
        ))}
      </SpeedDial>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
            {actionType === 'tarea' ? 'Nueva Tarea' : actionType === 'oportunidad' ? 'Nueva Venta' : 'Registrar Gestión'}
          </Typography>
          <IconButton onClick={() => setFormOpen(false)} size="small"><FiX /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Cliente</InputLabel>
              <Select value={selectedCliente} label="Cliente" onChange={(e) => setSelectedCliente(e.target.value)}>
                {clientes.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.nombre} {c.empresa ? `· ${c.empresa}` : ''}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {actionType !== 'interaccion' && (
              <TextField label="Título" size="small" fullWidth value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            )}

            {actionType === 'oportunidad' && (
              <TextField label="Valor ($)" size="small" fullWidth type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
            )}

            {actionType === 'interaccion' && (
              <TextField label="Descripción" size="small" fullWidth multiline minRows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            )}

            {actionType === 'tarea' && (
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={tipo} label="Tipo" onChange={(e) => setTipo(e.target.value)}>
                  <MenuItem value="Tarea">Tarea</MenuItem>
                  <MenuItem value="Cita">Cita</MenuItem>
                  <MenuItem value="Llamada">Llamada</MenuItem>
                  <MenuItem value="Seguimiento">Seguimiento</MenuItem>
                </Select>
              </FormControl>
            )}

            {(actionType === 'tarea' || actionType === 'interaccion') && (
              <TextField label="Notas" size="small" fullWidth multiline minRows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setFormOpen(false)} variant="outlined" size="small">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={guardando} startIcon={<FiSave size={14} />}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
