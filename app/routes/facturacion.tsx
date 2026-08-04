import React, { useState, useEffect } from "react";
import {
  Box, Typography, Chip, Alert, CircularProgress,
  Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { FiRefreshCw, FiPlus, FiFileText, FiX } from "react-icons/fi";
import { useCRMStore } from "../store/useCRMStore";

export function meta() {
  return [{ title: "Facturación | CRM Agencia" }];
}

export default function Facturacion() {
  const facturas = useCRMStore((s) => s.facturas);
  const fetchFacturas = useCRMStore((s) => s.fetchFacturas);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchFacturas();
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Error al cargar facturas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchFacturas]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <FiFileText size={22} color="#009688" />
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#009688", flex: 1 }}>Facturación</Typography>
        <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={() => fetchFacturas()} disabled={loading}>Recargar</Button>
        <Button variant="contained" size="small" startIcon={<FiPlus size={16} />} sx={{ minHeight: 32 }}>Nueva</Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}>
          <Chip label={`${facturas.length} facturas`} size="small" />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && facturas.length === 0 && (
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <Typography color="text.secondary">No hay facturas registradas.</Typography>
        </Paper>
      )}

      {!loading && !error && facturas.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {facturas.slice(0, 20).map((f: any) => (
            <Paper key={f.id} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Factura #{f.id}</Typography>
                <Typography variant="caption" color="text.secondary">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</Typography>
              </Box>
              <Chip size="small" label={f.estado || "Sin estado"} />
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>{f.total != null ? `$${Number(f.total).toFixed(0)}` : ""}</Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
