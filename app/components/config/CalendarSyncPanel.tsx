import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Chip, Alert } from "@mui/material";
import { calendarSyncService, type CalendarSyncConfig, type CalendarSyncLog } from "../../services/sync/calendarSync";

export const CalendarSyncPanel: React.FC = () => {
  const [configs, setConfigs] = useState<CalendarSyncConfig[]>([]);
  const [logs, setLogs] = useState<CalendarSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([calendarSyncService.getConfigs(), calendarSyncService.getRecentLogs()]);
      setConfigs(c);
      setLogs(l);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (cfg: CalendarSyncConfig) => {
    await calendarSyncService.upsertConfig({ ...cfg, enabled: !cfg.enabled });
    load();
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>Sincronización de Calendario</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Alert severity="info" sx={{ mb: 2 }}>Cargando configuraciones...</Alert>}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {configs.map((cfg) => (
          <Box key={cfg.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{cfg.provider.toUpperCase()}</Typography>
              <Typography variant="caption" color="text.secondary">
                {cfg.sync_direction} · cada {cfg.sync_interval_minutes} min · {cfg.enabled ? "Activo" : "Pausado"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Chip label={cfg.last_sync_at ? new Date(cfg.last_sync_at).toLocaleString() : "Sin sincronizar"} size="small" />
              <FormControlLabel control={<Switch checked={cfg.enabled} onChange={() => toggle(cfg)} />} label="" />
            </Box>
          </Box>
        ))}
        {configs.length === 0 && !loading && (
          <Alert severity="warning">No hay configuraciones. Creá una para sincronizar Google, Outlook o CalDav.</Alert>
        )}
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Logs recientes</Typography>
        {logs.slice(0, 5).map((log) => (
          <Box key={log.id} sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "text.secondary", py: 0.5 }}>
            <span>{new Date(log.started_at).toLocaleString()}</span>
            <span>{log.status} · {log.events_processed} eventos</span>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
