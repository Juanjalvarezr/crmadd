import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, FormControl, InputLabel, Select, Snackbar, Alert, Box, IconButton } from '@mui/material';
import { FiUsers, FiTrendingUp, FiDollarSign, FiPlus, FiUserPlus, FiList, FiX } from 'react-icons/fi';
import { clientesService, proyectosService, tareasService, transaccionesService, oportunidadesService } from '../services/database';
import { facturasService } from '../services/facturacion';

type AccionRapida = {
  icon: React.ReactNode;
  name: string;
  tipo: 'cliente' | 'tarea' | 'oportunidad' | 'factura';
};

export const MobileFab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [tipoAccion, setTipoAccion] = useState<AccionRapida['tipo']>('cliente');
  const [snackbar, setSnackbar] = useState<{ open: boolean; mensaje: string; severity: 'success' | 'error' }>({ open: false, mensaje: '', severity: 'success' });

  const [formCliente, setFormCliente] = useState({ nombre: '', email: '', telefono: '', empresa: '' });
  const [formTarea, setFormTarea] = useState({ titulo: '', descripcion: '', fecha: '', prioridad: 'Media' as const });
  const [formOportunidad, setFormOportunidad] = useState({ nombre: '', valor: '', etapa: 'Prospección' as const, probabilidad: 25 });
  const [formFactura, setFormFactura] = useState({ cliente_nombre: '', monto: '', concepto: '', estado_pago: 'pendiente' as const });

  const acciones: AccionRapida[] = [
    { icon: <FiUserPlus size={20} />, name: 'Nuevo Cliente', tipo: 'cliente' },
    { icon: <FiList size={20} />, name: 'Nueva Tarea', tipo: 'tarea' },
    { icon: <FiDollarSign size={20} />, name: 'Nueva Factura', tipo: 'factura' },
    { icon: <FiTrendingUp size={20} />, name: 'Nueva Venta', tipo: 'oportunidad' },
  ];

  const abrirDialogo = (tipo: AccionRapida['tipo']) => {
    setTipoAccion(tipo);
    setDialogoAbierto(true);
    setOpen(false);
  };

  const cerrarDialogo = () => {
    setDialogoAbierto(false);
    setFormCliente({ nombre: '', email: '', telefono: '', empresa: '' });
    setFormTarea({ titulo: '', descripcion: '', fecha: '', prioridad: 'Media' });
    setFormOportunidad({ nombre: '', valor: '', etapa: 'Prospección', probabilidad: 25 });
    setFormFactura({ cliente_nombre: '', monto: '', concepto: '', estado_pago: 'pendiente' });
  };

  const handleGuardarCliente = async () => {
    if (!formCliente.nombre.trim()) {
      setSnackbar({ open: true, mensaje: 'El nombre es obligatorio', severity: 'error' });
      return;
    }
    try {
      const cliente = await clientesService.create({
        nombre: formCliente.nombre,
        email: formCliente.email,
        telefono: formCliente.telefono,
        empresa: formCliente.empresa,
        fuente: 'FAB',
        estado: 'nuevo',
      } as any);
      setSnackbar({ open: true, mensaje: `Cliente "${cliente.nombre}" creado correctamente`, severity: 'success' });
      cerrarDialogo();
    } catch (err: any) {
      setSnackbar({ open: true, mensaje: 'Error al crear cliente: ' + err.message, severity: 'error' });
    }
  };

  const handleGuardarTarea = async () => {
    if (!formTarea.titulo.trim()) {
      setSnackbar({ open: true, mensaje: 'El título es obligatorio', severity: 'error' });
      return;
    }
    try {
      await tareasService.create({
        titulo: formTarea.titulo,
        descripcion: formTarea.descripcion,
        fecha: formTarea.fecha || undefined,
        prioridad: formTarea.prioridad,
        estado: 'Pendiente',
        origen: 'FAB',
      } as any);
      setSnackbar({ open: true, mensaje: 'Tarea creada correctamente', severity: 'success' });
      cerrarDialogo();
    } catch (err: any) {
      setSnackbar({ open: true, mensaje: 'Error al crear tarea: ' + err.message, severity: 'error' });
    }
  };

  const handleGuardarOportunidad = async () => {
    if (!formOportunidad.nombre.trim()) {
      setSnackbar({ open: true, mensaje: 'El nombre es obligatorio', severity: 'error' });
      return;
    }
    try {
      await oportunidadesService.create({
        ...formOportunidad,
        valor: Number(formOportunidad.valor) || 0,
        origen: 'FAB',
      } as any);
      setSnackbar({ open: true, mensaje: 'Oportunidad creada correctamente', severity: 'success' });
      cerrarDialogo();
    } catch (err: any) {
      setSnackbar({ open: true, mensaje: 'Error al crear oportunidad: ' + err.message, severity: 'error' });
    }
  };

  const handleGuardarFactura = async () => {
    if (!formFactura.cliente_nombre.trim() || !formFactura.monto) {
      setSnackbar({ open: true, mensaje: 'Cliente y monto son obligatorios', severity: 'error' });
      return;
    }
    try {
      await facturasService.create({
        cliente_nombre: formFactura.cliente_nombre,
        monto: Number(formFactura.monto),
        concepto: formFactura.concepto,
        estado_pago: formFactura.estado_pago,
        origen: 'FAB',
      } as any);
      setSnackbar({ open: true, mensaje: 'Factura creada correctamente', severity: 'success' });
      cerrarDialogo();
    } catch (err: any) {
      setSnackbar({ open: true, mensaje: 'Error al crear factura: ' + err.message, severity: 'error' });
    }
  };

  const handleGuardar = () => {
    switch (tipoAccion) {
      case 'cliente':
        handleGuardarCliente();
        break;
      case 'tarea':
        handleGuardarTarea();
        break;
      case 'oportunidad':
        handleGuardarOportunidad();
        break;
      case 'factura':
        handleGuardarFactura();
        break;
    }
  };

  return (
    <>
      <SpeedDial
        ariaLabel="Acciones rápidas"
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 28 },
          right: { xs: 16, sm: 24 },
          zIndex: 1400,
          display: 'flex',
          '& .MuiSpeedDial-fab': {
            background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)',
            boxShadow: '0 8px 24px rgba(233,30,99,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #d81b60 0%, #8e24aa 100%)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          },
          '& .MuiSpeedDialAction-staticTooltipLabel': {
            whiteSpace: 'nowrap',
          },
        }}
        icon={<SpeedDialIcon icon={<FiPlus size={24} />} openIcon={<FiPlus style={{ transform: 'rotate(45deg)' }} size={24} />} />}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
      >
        {acciones.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            title={action.name}
            onClick={() => abrirDialogo(action.tipo)}
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? '#1e1e2e' : '#ffffff',
              color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#1f232e',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a3a' : '#f5f5f5',
                transform: 'scale(1.08)',
              },
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ))}
      </SpeedDial>

      {/* Diálogo genérico para creación rápida */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {acciones.find(a => a.tipo === tipoAccion)?.name}
            <IconButton size="small" onClick={cerrarDialogo}><FiX /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {tipoAccion === 'cliente' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Nombre *" fullWidth value={formCliente.nombre} onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })} />
              <TextField label="Email" fullWidth value={formCliente.email} onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })} />
              <TextField label="Teléfono" fullWidth value={formCliente.telefono} onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })} />
              <TextField label="Empresa" fullWidth value={formCliente.empresa} onChange={(e) => setFormCliente({ ...formCliente, empresa: e.target.value })} />
            </Box>
          )}
          {tipoAccion === 'tarea' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Título *" fullWidth value={formTarea.titulo} onChange={(e) => setFormTarea({ ...formTarea, titulo: e.target.value })} />
              <TextField label="Descripción" fullWidth multiline rows={2} value={formTarea.descripcion} onChange={(e) => setFormTarea({ ...formTarea, descripcion: e.target.value })} />
              <TextField label="Fecha" type="date" fullWidth value={formTarea.fecha} onChange={(e) => setFormTarea({ ...formTarea, fecha: e.target.value })} InputLabelProps={{ shrink: true }} />
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select value={formTarea.prioridad} label="Prioridad" onChange={(e) => setFormTarea({ ...formTarea, prioridad: e.target.value as any })}>
                  <MenuItem value="Alta">Alta</MenuItem>
                  <MenuItem value="Media">Media</MenuItem>
                  <MenuItem value="Baja">Baja</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          {tipoAccion === 'oportunidad' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Nombre *" fullWidth value={formOportunidad.nombre} onChange={(e) => setFormOportunidad({ ...formOportunidad, nombre: e.target.value })} />
              <TextField label="Valor (COP)" type="number" fullWidth value={formOportunidad.valor} onChange={(e) => setFormOportunidad({ ...formOportunidad, valor: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Etapa</InputLabel>
                <Select value={formOportunidad.etapa} label="Etapa" onChange={(e) => setFormOportunidad({ ...formOportunidad, etapa: e.target.value as any })}>
                  <MenuItem value="Prospección">Prospección</MenuItem>
                  <MenuItem value="Propuesta">Propuesta</MenuItem>
                  <MenuItem value="Negociación">Negociación</MenuItem>
                  <MenuItem value="Cierre">Cierre</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          {tipoAccion === 'factura' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Cliente *" fullWidth value={formFactura.cliente_nombre} onChange={(e) => setFormFactura({ ...formFactura, cliente_nombre: e.target.value })} />
              <TextField label="Monto (COP) *" type="number" fullWidth value={formFactura.monto} onChange={(e) => setFormFactura({ ...formFactura, monto: e.target.value })} />
              <TextField label="Concepto" fullWidth value={formFactura.concepto} onChange={(e) => setFormFactura({ ...formFactura, concepto: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={formFactura.estado_pago} label="Estado" onChange={(e) => setFormFactura({ ...formFactura, estado_pago: e.target.value as any })}>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="parcial">Parcial</MenuItem>
                  <MenuItem value="pagado">Pagado</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={cerrarDialogo} size="small">Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained" size="small">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </>
  );
};
