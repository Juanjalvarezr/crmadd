import React, { useState, useEffect } from 'react';
import { Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Stack, Switch, FormControlLabel } from '@mui/material';
import { FiUsers, FiCheckSquare, FiTrendingUp, FiPlus, FiX, FiMessageSquare, FiSave, FiCamera, FiSend, FiBook, FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { tareasService, oportunidadesService, interaccionesService } from '../services/supabase';
import { useCRMStore } from '../store/useCRMStore';
import { globalSnack } from '../components/GlobalSnackbar';
import ScannerTarjetas from './ScannerTarjetas';
import { registrarGestion, TIPOS_GESTION } from '../services/gestionService';
import { enviarMensajeWhatsApp } from '../services/outboundService';

type ActionType = 'tarea' | 'oportunidad' | 'interaccion' | 'propuesta' | 'cotizacion' | 'catalogo' | 'cobro' | 'factura' | 'contrato';

export const MobileFab: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>('tarea');
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('Tarea');
  const [guardando, setGuardando] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [servicio, setServicio] = useState('');
  const [monto, setMonto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviarWpp, setEnviarWpp] = useState(false);
  const navigate = useNavigate();
  const clientesStore = useCRMStore((s) => s.clientes);
  const fetchClientes = useCRMStore((s) => s.fetchClientes);
  
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
    { icon: <FiCamera size={20} />, name: 'Escanear tarjeta', type: 'escanear' as string },
    { icon: <FiSend size={20} />, name: 'Enviar propuesta', type: 'propuesta' as ActionType },
    { icon: <FiBook size={20} />, name: 'Enviar cotización', type: 'cotizacion' as ActionType },
    { icon: <FiDollarSign size={20} />, name: 'Enviar catálogo', type: 'catalogo' as ActionType },
    { icon: <FiDollarSign size={20} />, name: 'Enviar factura', type: 'factura' as ActionType },
    { icon: <FiBook size={20} />, name: 'Enviar contrato', type: 'contrato' as ActionType },
    { icon: <FiMessageSquare size={20} />, name: 'Cobro / recordatorio', type: 'cobro' as ActionType },
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
        globalSnack.show('Seleccioná un cliente', 'warning');
        setGuardando(false);
        return;
      }

      if (actionType === 'tarea') {
        if (!titulo.trim()) {
          globalSnack.show('Título requerido', 'warning');
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
        globalSnack.show('Tarea creada', 'success');
      } else if (actionType === 'oportunidad') {
        if (!titulo.trim()) {
          globalSnack.show('Título requerido', 'warning');
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
        globalSnack.show('Oportunidad creada', 'success');
      } else if (actionType === 'interaccion') {
        const cliente = clientes.find((c) => String(c.id) === String(selectedCliente));
        if (!cliente) {
          globalSnack.show('Seleccioná un cliente', 'warning');
          setGuardando(false);
          return;
        }
        const res = await registrarGestion({
          cliente,
          tipo: tipo || 'Nota',
          asunto: titulo.trim() || 'Gestión',
          contenido: descripcion.trim(),
          enviar: enviarWpp ? 'whatsapp' : null,
        });
        globalSnack.show(
          res.etapa ? `Registro guardado · etapa: ${res.etapa}` : 'Registro guardado en el historial',
          'success'
        );
      }

      setFormOpen(false);
    } catch (e: any) {
      globalSnack.show(e?.message || 'Error guardando', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const esAccionDoc = ['propuesta', 'cotizacion', 'catalogo', 'cobro', 'factura', 'contrato'].includes(actionType);

  const abrirDoc = (tipo: ActionType) => {
    setActionType(tipo);
    setTitulo('');
    setDescripcion('');
    setServicio('');
    setMonto('');
    setSelectedCliente(clientes[0]?.id ? String(clientes[0].id) : '');
    setFormOpen(true);
    setOpen(false);
  };

  const handleScannerAction = async (d: any, action: 'propuesta' | 'cotizacion' | 'factura' | 'whatsapp' | 'llamar') => {
    const c = { id: undefined, nombre: d.nombre, telefono: d.telefono, email: d.email, empresa: d.empresa } as any;
    try {
      if (action === 'llamar') {
        if (!d.telefono) { globalSnack.show('Sin teléfono para llamar', 'warning'); return; }
        window.open(`tel:${String(d.telefono).replace(/\D/g, '')}`, '_self');
        return;
      }
      const tipoPlantilla = action === 'whatsapp' ? 'saludo' : action === 'cotizacion' ? 'cotizacion' : action === 'factura' ? 'factura' : 'propuesta';
      const extra: any = { servicio: d.empresa || 'nuestros servicios', agente: 'el equipo' };
      if (action !== 'whatsapp') extra.doc_tipo = action;
      if (action === 'factura') { extra.monto = 'según factura'; extra.fecha = new Date().toLocaleDateString('es-CO'); }
      const res = await enviarMensajeWhatsApp(c, tipoPlantilla, extra);
      globalSnack.show(res.ok ? `${action} encolada para ${d.nombre || 'el contacto'}` : (res.error || 'No se pudo encolar'), res.ok ? 'success' : 'error');
    } catch (e: any) {
      globalSnack.show(e?.message || 'Error en acción de tarjeta', 'error');
    }
  };

  const handleEnviarDoc = async () => {
    const cliente = clientes.find((c) => String(c.id) === String(selectedCliente));
    if (!cliente) {
      globalSnack.show('Seleccioná un cliente', 'warning');
      return;
    }
    if (!cliente.telefono) {
      globalSnack.show('El cliente no tiene teléfono para WhatsApp', 'warning');
      return;
    }
    setEnviando(true);
    try {
      const tipoPlantilla = actionType === 'cobro' ? 'recordatorio_pago' : actionType === 'catalogo' ? 'saludo' : actionType;
      const extra: Record<string, any> = {
        servicio: servicio || 'nuestros servicios',
        agente: 'el equipo',
      };
      if (actionType === 'cobro') {
        extra.monto = monto || 'el valor pendiente';
        extra.fecha = new Date().toLocaleDateString('es-CO');
      } else if (actionType === 'cotizacion') {
        extra.doc_tipo = 'cotizacion';
        if (monto) extra.monto = monto;
      } else if (actionType === 'catalogo') {
        // sin documento: solo mensaje
      } else if (actionType === 'factura' || actionType === 'contrato') {
        extra.doc_tipo = actionType;
        extra.monto = monto || (actionType === 'factura' ? 'según factura' : '');
        extra.fecha = new Date().toLocaleDateString('es-CO');
      } else {
        extra.doc_tipo = 'propuesta';
      }
      const res = await enviarMensajeWhatsApp(cliente as any, tipoPlantilla as string, extra);
      if (res.ok) {
        globalSnack.show('Enviado a la cola de WhatsApp (n8n lo entrega).', 'success');
        setFormOpen(false);
      } else {
        globalSnack.show(res.error || 'No se pudo encolar', 'error');
      }
    } catch (e: any) {
      globalSnack.show(e?.message || 'Error enviando', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Fab
        aria-label="Acciones rápidas"
        onClick={() => setMenuOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1400,
          backgroundColor: '#e91e63',
          '&:hover': { backgroundColor: '#c2185b' },
        }}
      >
        <FiPlus size={24} />
      </Fab>

      <Dialog
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 18, position: 'fixed', bottom: 0, width: '100%', mb: 0 } }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>Acciones rápidas</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 0.5, pb: 1 }}>
          <Stack spacing={0.5}>
            {acciones.map((action) => (
              <Button
                key={action.name}
                startIcon={action.icon}
                onClick={() => {
                  if ('path' in action) {
                    navigate(action.path as string);
                    setMenuOpen(false);
                  } else if (action.type === 'escanear') {
                    setScannerOpen(true);
                    setMenuOpen(false);
                  } else {
                    abrirDoc(action.type as ActionType);
                  }
                }}
                sx={{ justifyContent: 'flex-start', py: 1, px: 1.5, borderRadius: 10, color: 'text.primary' }}
              >
                {action.name}
              </Button>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
            {actionType === 'propuesta' ? 'Enviar propuesta'
              : actionType === 'cotizacion' ? 'Enviar cotización'
              : actionType === 'catalogo' ? 'Enviar catálogo'
              : actionType === 'cobro' ? 'Mensaje de cobro'
              : actionType === 'tarea' ? 'Nueva Tarea'
              : actionType === 'oportunidad' ? 'Nueva Venta' : 'Registrar Gestión'}
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
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de acción</InputLabel>
                <Select value={tipo} label="Tipo de acción" onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS_GESTION.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {actionType === 'interaccion' && (
              <TextField label="Descripción" size="small" fullWidth multiline minRows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            )}

            {actionType === 'interaccion' && (
              <FormControlLabel
                control={<Switch size="small" checked={enviarWpp} onChange={(e) => setEnviarWpp(e.target.checked)} />}
                label="Enviar mensaje por WhatsApp"
              />
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

            {esAccionDoc && (
              <TextField label="Servicio / motivo" size="small" fullWidth value={servicio} onChange={(e) => setServicio(e.target.value)} placeholder="Ej: SEO, pauta, diseño web" />
            )}

            {esAccionDoc && actionType !== 'catalogo' && (
              <TextField label="Monto (opcional)" size="small" fullWidth type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
            )}

            {esAccionDoc && (
              <Typography variant="caption" color="text.secondary">
                Se genera el documento (si aplica) y se envía por WhatsApp en forma personalizada.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setFormOpen(false)} variant="outlined" size="small">Cancelar</Button>
          {esAccionDoc ? (
            <Button onClick={handleEnviarDoc} variant="contained" size="small" disabled={enviando} startIcon={<FiSend size={14} />}>
              {enviando ? 'Encolando...' : 'Enviar por WhatsApp'}
            </Button>
          ) : (
            <Button onClick={handleSave} variant="contained" size="small" disabled={guardando} startIcon={<FiSave size={14} />}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ScannerTarjetas
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSave={(data) => {
          const nombre = (data as any)?.nombre || '';
          globalSnack.show(nombre ? `Tarjeta: ${nombre}` : 'Tarjeta guardada', 'success');
        }}
        onAction={handleScannerAction}
      />
    </>
  );
};
