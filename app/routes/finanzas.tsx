import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Paper, Button, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Alert, Divider, useTheme
} from "@mui/material";
import {
  FiDownload, FiRefreshCw, FiFilter, FiPlus, FiX,
  FiDollarSign, FiArrowUp, FiArrowDown, FiActivity
} from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { transaccionesService } from "../services/database";
import type { Transaccion } from "../types/crm";
import SafeChip from "../components/SafeChip";

const FORMATO_MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const hoy = () => format(new Date(), "yyyy-MM-dd");

export function meta() {
  return [
    { title: "Finanzas | DESEO DIGITAL" },
    { name: "description", content: "Control de ingresos y egresos del CRM" },
  ];
}

type TipoFiltro = "todos" | "ingreso" | "egreso";
type CategoriaFiltro = "todas" | "nomina" | "suscripcion" | "servicio" | "otro";

export default function Finanzas() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaFiltro>("todas");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(hoy());
  const [filtroFechaFin, setFiltroFechaFin] = useState(hoy());
  const [openDialog, setOpenDialog] = useState(false);

  // Formulario
  const [formTipo, setFormTipo] = useState<"ingreso" | "egreso">("ingreso");
  const [formCategoria, setFormCategoria] = useState<"nomina" | "suscripcion" | "servicio" | "otro">("servicio");
  const [formMonto, setFormMonto] = useState("");
  const [formMoneda, setFormMoneda] = useState("COP");
  const [formFormaPago, setFormFormaPago] = useState<"efectivo" | "transferencia" | "tarjeta">("transferencia");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formFecha, setFormFecha] = useState(hoy());

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transaccionesService.getAll();
      setTransacciones(data || []);
    } catch (err: any) {
      setError(err?.message || "Error cargando finanzas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtradas = useMemo(() => {
    return transacciones.filter((t) => {
      if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false;
      if (filtroCategoria !== "todas" && t.categoria !== filtroCategoria) return false;
      if (filtroFechaInicio && t.fecha < filtroFechaInicio) return false;
      if (filtroFechaFin && t.fecha > filtroFechaFin) return false;
      return true;
    });
  }, [transacciones, filtroTipo, filtroCategoria, filtroFechaInicio, filtroFechaFin]);

  const resumen = useMemo(() => {
    const ingresos = filtradas
      .filter((t) => t.tipo === "ingreso")
      .reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
    const egresos = filtradas
      .filter((t) => t.tipo === "egreso")
      .reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      total: filtradas.length,
    };
  }, [filtradas]);

  const handleCrear = async () => {
    if (!formMonto || Number(formMonto) <= 0) return;
    await transaccionesService.create({
      tipo: formTipo,
      categoria: formCategoria,
      monto: Number(formMonto),
      moneda: formMoneda,
      forma_pago: formFormaPago,
      descripcion: formDescripcion || null,
      fecha: formFecha,
      created_at: new Date().toISOString(),
    });
    setOpenDialog(false);
    setFormMonto("");
    setFormDescripcion("");
    await load();
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, sm: 3 }, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h4" fontWeight={700}>Finanzas</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" startIcon={<FiRefreshCw />} onClick={load}>Actualizar</Button>
          <Button variant="contained" startIcon={<FiPlus />} onClick={() => setOpenDialog(true)}>Nueva transacción</Button>
        </Box>
      </Box>

      {/* Resumen */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: "success.light", color: "success.contrastText", display: "flex" }}><FiArrowUp /></Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Ingresos</Typography>
            <Typography variant="h6" fontWeight={700}>{FORMATO_MONEDA.format(resumen.ingresos)}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: "error.light", color: "error.contrastText", display: "flex" }}><FiArrowDown /></Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Egresos</Typography>
            <Typography variant="h6" fontWeight={700}>{FORMATO_MONEDA.format(resumen.egresos)}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.light", color: "primary.contrastText", display: "flex" }}><FiActivity /></Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Balance</Typography>
            <Typography variant="h6" fontWeight={700}>{FORMATO_MONEDA.format(resumen.balance)}</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={filtroTipo} label="Tipo" onChange={(e) => setFiltroTipo(e.target.value as TipoFiltro)}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="ingreso">Ingresos</MenuItem>
              <MenuItem value="egreso">Egresos</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Categoría</InputLabel>
            <Select value={filtroCategoria} label="Categoría" onChange={(e) => setFiltroCategoria(e.target.value as CategoriaFiltro)}>
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="nomina">Nómina</MenuItem>
              <MenuItem value="suscripcion">Suscripción</MenuItem>
              <MenuItem value="servicio">Servicio</MenuItem>
              <MenuItem value="otro">Otro</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Desde"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filtroFechaInicio}
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filtroFechaFin}
            onChange={(e) => setFiltroFechaFin(e.target.value)}
          />
          <SafeChip label={`${filtradas.length} registros`} color="primary" variant="outlined" />
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Forma de pago</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtradas.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">Sin registros</Typography></TableCell></TableRow>
              )}
              {filtradas.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.fecha}</TableCell>
                  <TableCell><SafeChip label={t.tipo === "ingreso" ? "Ingreso" : "Egreso"} color={t.tipo === "ingreso" ? "success" : "error"} size="small" /></TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{t.categoria}</TableCell>
                  <TableCell>{t.descripcion || "-"}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{FORMATO_MONEDA.format(Number(t.monto))}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{t.forma_pago}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Alta rápida */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva transacción</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={formTipo} label="Tipo" onChange={(e) => setFormTipo(e.target.value as any)}>
                <MenuItem value="ingreso">Ingreso</MenuItem>
                <MenuItem value="egreso">Egreso</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select value={formCategoria} label="Categoría" onChange={(e) => setFormCategoria(e.target.value as any)}>
                <MenuItem value="nomina">Nómina</MenuItem>
                <MenuItem value="suscripcion">Suscripción</MenuItem>
                <MenuItem value="servicio">Servicio</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField label="Monto" type="number" value={formMonto} onChange={(e) => setFormMonto(e.target.value)} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Moneda</InputLabel>
                <Select value={formMoneda} label="Moneda" onChange={(e) => setFormMoneda(e.target.value)}>
                  <MenuItem value="COP">COP</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Forma de pago</InputLabel>
              <Select value={formFormaPago} label="Forma de pago" onChange={(e) => setFormFormaPago(e.target.value as any)}>
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
                <MenuItem value="tarjeta">Tarjeta</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Descripción" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} multiline minRows={2} fullWidth />
            <TextField label="Fecha" type="date" value={formFecha} onChange={(e) => setFormFecha(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} startIcon={<FiX />}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrear}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

