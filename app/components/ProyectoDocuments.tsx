import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, List, ListItem, IconButton, Chip, Button, ListItemIcon, ListItemText
} from "@mui/material";
import { ExternalLink, FileText, ScrollText, Eye } from "lucide-react";
import { facturasService } from "../services/facturacion";
import { contratosService } from "../services/facturacion";
import type { Proyecto } from "../types/crm";

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

interface ProyectoDocumentsProps {
  proyecto: Proyecto;
  onViewInvoice?: (facturaId: string) => void;
  onViewContract?: (contratoId: string) => void;
}

export function ProyectoDocuments({ proyecto, onViewInvoice, onViewContract }: ProyectoDocumentsProps) {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [facturasData, contratosData] = await Promise.all([
          facturasService.getAll().catch(() => []),
          contratosService.getAll().catch(() => [])
        ]);
        const relacionadas = facturasData.filter((f: any) => f.proyecto_id === proyecto.id);
        const vinculados = contratosData.filter((c: any) => c.proyecto_id === proyecto.id);
        setFacturas(relacionadas);
        setContratos(vinculados);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proyecto.id]);

  const getEstadoFacturaColor = (estado: string) => {
    switch (estado) {
      case "pagada": return "success";
      case "enviada": return "info";
      case "borrador": return "default";
      case "anulada": return "error";
      default: return "default";
    }
  };

  const getEstadoContratoColor = (estado: string) => {
    switch (estado) {
      case "firmado": return "success";
      case "activo": return "info";
      case "borrador": return "default";
      case "finalizado": return "primary";
      case "cancelado": return "error";
      default: return "default";
    }
  };

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
        <ScrollText size={18} color="#e91e63" />
        Documentos Vinculados (Facturas & Contratos)
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {/* Facturas */}
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 280, p: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <FileText size={14} /> Facturas Relacionadas
          </Typography>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Cargando...</Typography>
          ) : facturas.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No hay facturas vinculadas a este proyecto.
            </Typography>
          ) : (
            <List dense>
              {facturas.map((f) => (
                <ListItem key={f.id} sx={{ border: "1px solid #eee", borderRadius: 1, mb: 1, bgcolor: "white" }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FileText size={20} color="#e91e63" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>#{f.numero || f.id}</Typography>}
                    secondary={
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
                        <Chip
                          label={f.estado}
                          size="small"
                          color={getEstadoFacturaColor(f.estado) as any}
                          sx={{ fontSize: "0.65rem", height: 20 }}
                        />
                        <Typography variant="caption">{formatCOP(f.total)}</Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {onViewInvoice && (
                      <Tooltip title="Ver factura">
                        <IconButton size="small" onClick={() => onViewInvoice(f.id)}>
                          <Eye size={14} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small" component="a" href={`#/facturacion?factura=${f.id}`}>
                      <ExternalLink size={14} />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Contratos */}
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 280, p: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ScrollText size={14} /> Contratos Relacionados
          </Typography>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Cargando...</Typography>
          ) : contratos.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No hay contratos vinculados a este proyecto.
            </Typography>
          ) : (
            <List dense>
              {contratos.map((c) => (
                <ListItem key={c.id} sx={{ border: "1px solid #eee", borderRadius: 1, mb: 1, bgcolor: "white" }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ScrollText size={20} color="#9c27b0" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>{c.titulo}</Typography>}
                    secondary={
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
                        <Chip
                          label={c.estado}
                          size="small"
                          color={getEstadoContratoColor(c.estado) as any}
                          sx={{ fontSize: "0.65rem", height: 20 }}
                        />
                        {c.valor && <Typography variant="caption">{formatCOP(c.valor)}</Typography>}
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {onViewContract && (
                      <Tooltip title="Ver contrato">
                        <IconButton size="small" onClick={() => onViewContract(c.id)}>
                          <Eye size={14} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small" component="a" href={`#/contratos?contrato=${c.id}`}>
                      <ExternalLink size={14} />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
