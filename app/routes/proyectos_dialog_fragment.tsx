import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Chip, Stack, Alert, Button, Divider, List, ListItem, ListItemIcon, ListItemText,
  Grid, TextField, LinearProgress, FormControlLabel, Checkbox, IconButton
} from "@mui/material";
import {
  FiCalendar, FiTrash2, FiPlus, FiEye, FiExternalLink, FiFileText, FiDollarSign, FiUser
} from "react-icons/fi";
import {
  clientesService, proyectosService, facturasService, contratosService, tareasService
} from "../services/database";
import SafeChip from "../components/SafeChip";
import { formatCOP } from "../data/serviciosData";

export default function ProyectosDialogFragment({ selectedProyecto, activeProjectTab, setActiveProjectTab, showNotification }: any) {
  const [credenciales, setCredenciales] = useState<any[]>([]);
  const [mostrarPwd, setMostrarPwd] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!selectedProyecto?.id) return;
    credencialesService.getAll(Number(selectedProyecto.id)).then(setCredenciales).catch(() => {});
  }, [selectedProyecto?.id]);

  if (!selectedProyecto) return null;

  return (
    <Box sx={{ py: 1 }}>
      {activeProjectTab === 0 ? (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">Descripción</Typography>
          <Typography variant="body1" paragraph>{selectedProyecto.descripcion}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Cliente</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{selectedProyecto.clienteNombre}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Presupuesto</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCOP(selectedProyecto.presupuesto)}</Typography>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography variant="subtitle2" gutterBottom>💰 Control de Pagos (50/50)</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">Anticipo (50%): {formatCOP(selectedProyecto.presupuesto * 0.5)}</Typography>
                  <SafeChip
                    label={selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5) ? "RECIBIDO" : "PENDIENTE"}
                    size="small"
                    variant={selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5) ? "filled" : "outlined"}
                    sx={{
                      ...(selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5)
                        ? { bgcolor: '#4caf50', color: '#fff' }
                        : { borderColor: '#ff9800', color: '#ff9800' })
                    }}
                  />
                </Box>
                <TextField
                  label="Monto Recibido"
                  size="small"
                  type="number"
                  fullWidth
                  sx={{ mb: 1, bgcolor: 'white' }}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (!Number.isNaN(value)) {
                      proyectosService.update(selectedProyecto.id, { monto_pagado: value });
                    }
                  }}
                  defaultValue={selectedProyecto.montoPagado}
                />
                <LinearProgress
                  variant="determinate"
                  value={(selectedProyecto.montoPagado / selectedProyecto.presupuesto) * 100}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>📋 Onboarding Manual (Acciones Clave)</Typography>
              {Object.entries(selectedProyecto.onboardingChecklist || {}).map(([key, val]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      size="small"
                      checked={!!val}
                      onChange={(e) => {
                        proyectosService.update(selectedProyecto.id, {
                          onboarding_checklist: { ...(selectedProyecto.onboardingChecklist || {}), [key]: e.target.checked }
                        });
                      }}
                    />
                  }
                  label={<Typography variant="caption">{key.replace('_', ' ').toUpperCase()}</Typography>}
                />
              ))}
            </Grid>
          </Grid>
        </Box>
      ) : activeProjectTab === 1 ? (
        <TareasTab proyecto={selectedProyecto} />
      ) : activeProjectTab === 2 ? (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Brief Creativo</Typography>
          <TextField
            label="Responde las preguntas del brief de forma libre"
            size="small"
            fullWidth
            multiline
            minRows={8}
            value={typeof selectedProyecto.brief === 'string' ? selectedProyecto.brief : JSON.stringify(selectedProyecto.brief || {}, null, 2)}
            onChange={(e) => proyectosService.update(selectedProyecto.id, { brief: e.target.value })}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
          />
        </Box>
      ) : activeProjectTab === 3 ? (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Cronograma del Proyecto</Typography>
          {(() => {
            const items = Array.isArray(selectedProyecto.cronograma) ? selectedProyecto.cronograma : [];
            const [nuevo, setNuevo] = useState('');
            const add = async () => {
              if (!nuevo.trim()) return;
              await proyectosService.updateCronograma(selectedProyecto.id, [...items, { titulo: nuevo.trim(), completado: false, fecha: new Date().toISOString().split('T')[0] }]);
              setActiveProjectTab(activeProjectTab);
              setNuevo('');
            };
            const toggle = async (idx: number) => {
              const next = [...items];
              next[idx] = { ...next[idx], completado: !next[idx].completado };
              await proyectosService.updateCronograma(selectedProyecto.id, next);
              setActiveProjectTab(activeProjectTab);
            };
            return (
              <Stack spacing={1}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Ej: Grabación reel semana 2"
                    value={nuevo}
                    onChange={(e) => setNuevo(e.target.value)}
                  />
                  <Button variant="contained" size="small" onClick={add}>Agregar</Button>
                </Stack>
                <List dense>
                  {items.map((item: any, idx: number) => (
                    <ListItem key={idx} disableGutters
                      secondaryAction={
                        <IconButton size="small" color="error" onClick={() => toggle(idx)}>
                          <FiTrash2 size={16} />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}><Calendar size={18} /></ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 600, textDecoration: item.completado ? 'line-through' : 'none' }}>{item.titulo}</Typography>}
                        secondary={item.fecha}
                      />
                    </ListItem>
                  ))}
                  {items.length === 0 && (
                    <ListItem><ListItemText primary="Sin entregas pendientes" /></ListItem>
                  )}
                </List>
              </Stack>
            );
          })()}
        </Box>
      ) : activeProjectTab === 4 ? (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Canales Digitales</Typography>
          <Stack spacing={1}>
            {['Instagram', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn', 'Google Business', 'Página Web'].map((canal) => {
              const link = (selectedProyecto.canales || {})[canal];
              return (
                <Box key={canal} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={canal} size="small" variant="outlined" sx={{ minWidth: 160 }} />
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={`https://...`}
                    value={link || ''}
                    onChange={(e) => {
                      const updated = { ...(selectedProyecto.canales || {}), [canal]: e.target.value };
                      proyectosService.update(selectedProyecto.id, { canales: updated });
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Box>
      ) : activeProjectTab === 5 ? (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Contrato y Facturación</Typography>
          <Stack spacing={1}>
            <Button variant="outlined" size="small" startIcon={<FiFileText />} onClick={async () => {
              try {
                const pdfUrl = await contratosService.generarContratoPDF(selectedProyecto);
                showNotification('Contrato generado: descargalo desde /contratos', 'success');
              } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
            }}>Generar contrato</Button>
            <Button variant="outlined" size="small" startIcon={<FiFileText />} onClick={async () => {
              try {
                const pdfUrl = await facturasService.generarFacturaPDF(selectedProyecto);
                showNotification('Factura generada', 'success');
              } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
            }}>Generar factura</Button>
            {(selectedProyecto as any).contrato_url && (
              <Button size="small" variant="text" href={(selectedProyecto as any).contrato_url} target="_blank">Abrir contrato</Button>
            )}
            {selectedProyecto.facturacion_detalle && (
              <Alert severity="info" sx={{ whiteSpace: 'pre-wrap' }}>{typeof selectedProyecto.facturacion_detalle === 'string' ? selectedProyecto.facturacion_detalle : JSON.stringify(selectedProyecto.facturacion_detalle, null, 2)}</Alert>
            )}
          </Stack>
        </Box>
      ) : (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Credenciales y Accesos</Typography>
          <Button
            size="small"
            variant="contained"
            onClick={async () => {
              const canal = prompt('Canal (Google, Hostinger, Meta, Tiendanube...)', 'Google') || '';
              const usuario = prompt('Usuario / email') || '';
              const contrasena = prompt('Contraseña', '') || '';
              const url = prompt('URL (opcional)') || '';
              if (!canal) return;
              try {
                await credencialesService.create({ proyecto_id: String(selectedProyecto.id), tipo: 'cuenta', canal, usuario, contrasena, url });
                showNotification('Credencial guardada', 'success');
                const updated = await credencialesService.getAll(Number(selectedProyecto.id));
                setCredenciales(updated);
              } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
            }}
            startIcon={<FiPlus size={14} />}
          >Agregar</Button>
          {credenciales.length === 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>Sin credenciales cargadas.</Alert>
          )}
          <List dense sx={{ mt: 1 }}>
            {credenciales.map((c: any) => (
              <ListItem key={c.id} disableGutters secondaryAction={
                <IconButton size="small" color="error" onClick={async () => {
                  try {
                    await credencialesService.delete(c.id);
                    setCredenciales((prev: any[]) => prev.filter((x: any) => x.id !== c.id));
                    showNotification('Eliminado', 'success');
                  } catch (e:any) { showNotification('Error','error'); }
                }}>
                  <FiTrash2 size={16} />
                </IconButton>
              }>
                <ListItemIcon sx={{ minWidth: 32 }}><FiExternalLink size={18} /></ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{c.canal} · {c.usuario}</Typography>}
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{mostrarPwd[c.id] ? (c.contrasena || '') : '••••••••'}</Typography>
                      <IconButton size="small" onClick={() => setMostrarPwd((prev: any) => ({ ...prev, [c.id]: !prev[c.id] }))}>
                        {mostrarPwd[c.id] ? <FiEye size={14} color="#9e9e9e"/> : <FiEye size={14} color="#9e9e9e"/>}
                      </IconButton>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
