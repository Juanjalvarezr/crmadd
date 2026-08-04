import React, { useState, useEffect } from "react";
import {
  Box, Typography, Chip, Alert, CircularProgress,
  Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { FiRefreshCw, FiPlus, FiFileText, FiX } from "react-icons/fi";
import { useCRMStore } from "../store/useCRMStore";

export function meta() {
  return [{ title: "Contratos | CRM Agencia" }];
}

export default function Contratos() {
  const contratos = useCRMStore((s) => s.contratos);
  const fetchContratos = useCRMStore((s) => s.fetchContratos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchContratos();
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Error al cargar contratos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchContratos]);

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
        <FiFileText size={22} color="#795548" />
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#795548", flex: 1 }}>Contratos</Typography>
        <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={() => fetchContratos()} disabled={loading}>Recargar</Button>
        <Button variant="contained" size="small" startIcon={<FiPlus size={16} />} sx={{ minHeight: 32 }}>Nuevo</Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}>
          <Chip label={`${contratos.length} contratos`} size="small" />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && contratos.length === 0 && (
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <Typography color="text.secondary">No hay contratos registrados.</Typography>
        </Paper>
      )}

      {!loading && !error && contratos.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {contratos.slice(0, 20).map((c: any) => (
            <Paper key={c.id} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Contrato #{c.id}</Typography>
                <Typography variant="caption" color="text.secondary">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</Typography>
              </Box>
              <Chip size="small" label={c.estado || "Sin estado"} />
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>{c.valor != null ? `$${Number(c.valor).toFixed(0)}` : ""}</Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
