import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, FormControl, InputLabel, Select, Snackbar, Alert, Box, IconButton, Tooltip } from '@mui/material';
import { FiUsers, FiTrendingUp, FiDollarSign, FiPlus, FiUserPlus, FiList, FiX, FiFolder, FiFileText, FiCalendar, FiMessageSquare, FiCamera } from 'react-icons/fi';
import { clientesService, proyectosService, tareasService, transaccionesService, oportunidadesService } from '../services/database';
import { facturasService, contratosService } from '../services/facturacion';
import ScannerTarjetas from './ScannerTarjetas';
import { scanCardFromImage, type ExtractedCard } from '../services/ocrService';

type AccionRapida = {
  icon: React.ReactNode;
  name: string;
  tipo: 'cliente' | 'proyecto' | 'tarea' | 'oportunidad' | 'transaccion' | 'factura' | 'contrato' | 'scanner' | 'reunion' | 'whatsapp';
};

export const MobileFab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [acciones, setAcciones] = useState<AccionRapida[]>([]);
  const [accionFiltrada, setAccionFiltrada] = useState<AccionRapida | null>(null);
  const [tipoAccion, setTipoAccion] = useState<AccionRapida['tipo']>('cliente');

  const accionesBase: AccionRapida[] = [
    { icon: <FiUserPlus size={20} />, name: 'Nuevo Cliente', tipo: 'cliente' },
    { icon: <FiCalendar size={20} />, name: 'Agendar Reunión', tipo: 'reunion' },
    { icon: <FiMessageSquare size={20} />, name: 'WhatsApp Rápido', tipo: 'whatsapp' },
    { icon: <FiList size={20} />, name: 'Nueva Tarea', tipo: 'tarea' },
    { icon: <FiDollarSign size={20} />, name: 'Nueva Factura', tipo: 'factura' },
    { icon: <FiTrendingUp size={20} />, name: 'Nueva Venta', tipo: 'oportunidad' },
    { icon: <FiCamera size={20} />, name: 'Escanear Tarjeta', tipo: 'scanner' },
  ];

  const getAcciones = (): AccionRapida[] => {
    const ruta = location.pathname;
    if (ruta.startsWith('/clientes')) return [{ icon: <FiUserPlus size={20} />, name: 'Nuevo Cliente', tipo: 'cliente' }];
    if (ruta.startsWith('/proyectos')) return [{ icon: <FiFolder size={20} />, name: 'Nuevo Proyecto', tipo: 'proyecto' }];
    if (ruta.startsWith('/tareas')) return [{ icon: <FiList size={20} />, name: 'Nueva Tarea', tipo: 'tarea' }];
    if (ruta.startsWith('/ventas')) return [{ icon: <FiTrendingUp size={20} />, name: 'Nueva Venta', tipo: 'oportunidad' }];
    if (ruta.startsWith('/facturacion')) return [{ icon: <FiDollarSign size={20} />, name: 'Nueva Factura', tipo: 'factura' }];
    if (ruta.startsWith('/contratos')) return [{ icon: <FiFileText size={20} />, name: 'Nuevo Contrato', tipo: 'contrato' }];
    return accionesBase;
  };

  useEffect(() => {
    setAcciones(getAcciones());
  }, [location.pathname]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; mensaje: string; severity: 'success' | 'error' }>({ open: false, mensaje: '', severity: 'success' });
  const [clientes, setClientes] = useState<any[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [form, setForm] = useState({
    cliente_nombre: '',
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    titulo: '',
    descripcion: '',
    fecha: '',
    prioridad: 'Media' as const,
    valor: '',
    etapa: 'Prospección' as const,
    probabilidad: 25,
    monto: '',
    concepto: '',
    estado_pago: 'pendiente' as const,
    cliente_id: undefined as number | undefined,
    tipo: 'prestacion_servicios' as const,
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'borrador' as const,
  });


  const abrirDialogo = (tipo: AccionRapida['tipo']) => {
    setTipoAccion(tipo);
    setDialogoAbierto(true);
    setOpen(false);
  };

  const cerrarDialogo = () => {
    setDialogoAbierto(false);
    setForm({
      cliente_nombre: '', nombre: '', email: '', telefono: '', empresa: '', titulo: '', descripcion: '', fecha: '', prioridad: 'Media',
      valor: '', etapa: 'Prospección', probabilidad: 25, monto: '', concepto: '', estado_pago: 'pendiente', cliente_id: undefined,
      tipo: 'prestacion_servicios', fecha_inicio: '', fecha_fin: '', estado: 'borrador'
    });
  };

  const handleGuardar = async () => {
    try {
      switch (tipoAccion) {
        case 'cliente':
          if (!form.nombre.trim()) throw new Error('El nombre es obligatorio');
          const cliente = await clientesService.create({ nombre: form.nombre, email: form.email, telefono: form.telefono, empresa: form.empresa, fuente: 'FAB', estado: 'nuevo' } as any);
          setSnackbar({ open: true, mensaje: `Cliente "${cliente.nombre}" creado correctamente`, severity: 'success' });
          break;
        case 'tarea':
          if (!form.titulo.trim()) throw new Error('El título es obligatorio');
          await tareasService.create({ titulo: form.titulo, descripcion: form.descripcion, fecha: form.fecha || undefined, prioridad: form.prioridad, estado: 'Pendiente', origen: 'FAB' } as any);
          setSnackbar({ open: true, mensaje: 'Tarea creada correctamente', severity: 'success' });
          break;
        case 'oportunidad':
          if (!form.nombre.trim()) throw new Error('El nombre es obligatorio');
          await oportunidadesService.create({ nombre: form.nombre, valor: Number(form.valor) || 0, etapa: form.etapa, probabilidad: form.probabilidad, origen: 'FAB' } as any);
          setSnackbar({ open: true, mensaje: 'Oportunidad creada correctamente', severity: 'success' });
          break;
        case 'factura':
          if (!form.cliente_nombre.trim() || !form.monto) throw new Error('Cliente y monto son obligatorios');
          const factura = await facturasService.create({ cliente_nombre: form.cliente_nombre, monto: Number(form.monto), concepto: form.concepto, estado_pago: form.estado_pago, origen: 'FAB' } as any);
          setSnackbar({ open: true, mensaje: `Factura ${factura.numero || ''} creada correctamente`, severity: 'success' });
          break;
        case 'proyecto':
          if (!form.nombre.trim()) throw new Error('El nombre es obligatorio');
          await proyectosService.create({ nombre: form.nombre, descripcion: form.descripcion, cliente_id: form.cliente_id || undefined, estado: 'activo', origen: 'FAB' } as any);
          setSnackbar({ open: true, mensaje: 'Proyecto creado correctamente', severity: 'success' });
          break;
        case 'contrato':
          if (!form.titulo.trim()) throw new Error('El título es obligatorio');
          await contratosService.create({ titulo: form.titulo, cliente_id: form.cliente_id || undefined, tipo: form.tipo, fecha_inicio: form.fecha_inicio || undefined, fecha_fin: form.fecha_fin || undefined, monto: Number(form.monto) || 0, estado: form.estado, origen: 'FAB' } as any);
          setSnackbar({ open: true, mensaje: 'Contrato creado correctamente', severity: 'success' });
          break;
        case 'reunion':
          const meetUrl = 'https://meet.google.com/new';
          if (navigator?.clipboard) {
            try { await navigator.clipboard.writeText(meetUrl); } catch {}
          }
          window.open(meetUrl, '_blank');
          setSnackbar({ open: true, mensaje: 'Reunión creada y link copiado', severity: 'success' });
          break;
      }
      cerrarDialogo();
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          void audioRef.current.play();
        }
      } catch {}
    } catch (err: any) {
      setSnackbar({ open: true, mensaje: 'Error: ' + (err?.message || 'No se pudo guardar'), severity: 'error' });
    }
  };

  const actualizar = (campo: string, valor: any) => setForm({ ...form, [campo]: valor });

  const tituloAccion = () => {
    switch (tipoAccion) {
      case 'cliente': return 'Nuevo Cliente';
      case 'tarea': return 'Nueva Tarea';
      case 'oportunidad': return 'Nueva Oportunidad';
      case 'factura': return 'Nueva Factura';
      case 'proyecto': return 'Nuevo Proyecto';
      case 'contrato': return 'Nuevo Contrato';
      case 'reunion': return 'Agendar Reunión';
      default: return 'Nuevo';
    }
  };

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: { xs: 20, sm: 28 }, right: { xs: 16, sm: 24 }, zIndex: 2000 }}>
        <SpeedDial
          ariaLabel="Acciones rápidas"
          sx={{
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
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {tituloAccion()}
            <IconButton size="small" onClick={cerrarDialogo}><FiX /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {tipoAccion === 'cliente' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Nombre *" fullWidth value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} />
              <TextField label="Email" fullWidth value={form.email} onChange={(e) => actualizar('email', e.target.value)} />
              <TextField label="Teléfono" fullWidth value={form.telefono} onChange={(e) => actualizar('telefono', e.target.value)} />
              <TextField label="Empresa" fullWidth value={form.empresa} onChange={(e) => actualizar('empresa', e.target.value)} />
            </Box>
          )}
          {tipoAccion === 'tarea' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Título *" fullWidth value={form.titulo} onChange={(e) => actualizar('titulo', e.target.value)} />
              <TextField label="Descripción" fullWidth multiline rows={2} value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} />
              <TextField label="Fecha" type="date" fullWidth value={form.fecha} onChange={(e) => actualizar('fecha', e.target.value)} InputLabelProps={{ shrink: true }} />
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select value={form.prioridad} label="Prioridad" onChange={(e) => actualizar('prioridad', e.target.value)}>
                  <MenuItem value="Alta">Alta</MenuItem>
                  <MenuItem value="Media">Media</MenuItem>
                  <MenuItem value="Baja">Baja</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          {tipoAccion === 'oportunidad' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Nombre *" fullWidth value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} />
              <TextField label="Valor (COP)" type="number" fullWidth value={form.valor} onChange={(e) => actualizar('valor', e.target.value)} />
              <FormControl fullWidth>
                <InputLabel>Etapa</InputLabel>
                <Select value={form.etapa} label="Etapa" onChange={(e) => actualizar('etapa', e.target.value)}>
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
              <TextField label="Cliente *" fullWidth value={form.cliente_nombre} onChange={(e) => actualizar('cliente_nombre', e.target.value)} />
              <TextField label="Monto (COP) *" type="number" fullWidth value={form.monto} onChange={(e) => actualizar('monto', e.target.value)} />
              <TextField label="Concepto" fullWidth value={form.concepto} onChange={(e) => actualizar('concepto', e.target.value)} />
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={form.estado_pago} label="Estado" onChange={(e) => actualizar('estado_pago', e.target.value)}>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="parcial">Parcial</MenuItem>
                  <MenuItem value="pagado">Pagado</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          {tipoAccion === 'proyecto' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Nombre *" fullWidth value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} />
              <TextField label="Descripción" fullWidth multiline rows={2} value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} />
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select value={form.cliente_id || ''} label="Cliente" onChange={(e) => actualizar('cliente_id', Number(e.target.value) || undefined)}>
                  <MenuItem value="">Sin cliente</MenuItem>
                  {(clientes || []).map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          {tipoAccion === 'contrato' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Título *" fullWidth value={form.titulo} onChange={(e) => actualizar('titulo', e.target.value)} />
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select value={form.cliente_id || ''} label="Cliente" onChange={(e) => actualizar('cliente_id', Number(e.target.value) || undefined)}>
                  <MenuItem value="">Sin cliente</MenuItem>
                  {(clientes || []).map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={form.tipo} label="Tipo" onChange={(e) => actualizar('tipo', e.target.value)}>
                  <MenuItem value="prestacion_servicios">Prestación de servicios</MenuItem>
                  <MenuItem value="acuerdo_confidencialidad">Confidencialidad</MenuItem>
                  <MenuItem value="propiedad_intelectual">Propiedad intelectual</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Monto (COP)" type="number" fullWidth value={form.monto} onChange={(e) => actualizar('monto', e.target.value)} />
              <TextField label="Inicio" type="date" fullWidth value={form.fecha_inicio} onChange={(e) => actualizar('fecha_inicio', e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Fin" type="date" fullWidth value={form.fecha_fin} onChange={(e) => actualizar('fecha_fin', e.target.value)} InputLabelProps={{ shrink: true }} />
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

      <ScannerTarjetas
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSave={async (data) => {
          try {
            await clientesService.create({
              nombre: data.nombre || 'Sin nombre',
              empresa: data.empresa || '',
              telefono: data.telefono || '',
              email: data.email || '',
              fuente: 'Scanner FAB',
              estado: 'nuevo',
            } as any);
            setSnackbar({ open: true, mensaje: 'Cliente escaneado guardado correctamente', severity: 'success' });
          } catch (e: any) {
            setSnackbar({ open: true, mensaje: 'Error al guardar cliente escaneado: ' + (e?.message || ''), severity: 'error' });
          }
        }}
      />

      <audio ref={audioRef} src="data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" preload="auto" />
    </>
  );
};
