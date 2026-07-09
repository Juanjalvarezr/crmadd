import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, List, ListItem, IconButton, Button, ListItemSecondaryAction, Chip, TextField, Stack
} from "@mui/material";
import { Download, Trash2, Paperclip, Link2 } from "lucide-react";
import type { Proyecto } from "../types/crm";
import SafeChip from "../components/SafeChip";

interface Adjunto {
  id: string;
  proyectoId: string;
  nombre: string;
  url: string;
  tipo: "documento" | "imagen" | "pdf" | "otro";
  tamanio?: string;
  subidoEn: string;
}

const STORAGE_KEY = "crm_proyecto_adjuntos";

function cargarAdjuntos(proyectoId: string): Adjunto[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${proyectoId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarAdjuntos(proyectoId: string, adjuntos: Adjunto[]) {
  localStorage.setItem(`${STORAGE_KEY}_${proyectoId}`, JSON.stringify(adjuntos));
}

interface ProyectoAdjuntosProps {
  proyecto: Proyecto;
}

export function ProyectoAdjuntos({ proyecto }: ProyectoAdjuntosProps) {
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    setAdjuntos(cargarAdjuntos(proyecto.id));
  }, [proyecto.id]);

  const handleAgregar = () => {
    if (!nombre.trim() || !url.trim()) return;
    const adjunto: Adjunto = {
      id: Date.now().toString(),
      proyectoId: proyecto.id,
      nombre: nombre.trim(),
      url: url.trim(),
      tipo: url.endsWith(".pdf") ? "pdf" : url.match(/\.(png|jpg|jpeg|gif|webp)$/) ? "imagen" : "documento",
      subidoEn: new Date().toISOString()
    };
    const nuevos = [...adjuntos, adjunto];
    setAdjuntos(nuevos);
    guardarAdjuntos(proyecto.id, nuevos);
    setNombre("");
    setUrl("");
  };

  const handleEliminar = (id: string) => {
    const nuevos = adjuntos.filter(a => a.id !== id);
    setAdjuntos(nuevos);
    guardarAdjuntos(proyecto.id, nuevos);
  };

  const getFileIcon = (tipo: string) => {
    switch (tipo) {
      case "pdf": return "📕";
      case "imagen": return "🖼️";
      default: return "📄";
    }
  };

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
        <Paperclip size={18} />
        Adjuntos del Proyecto
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#f8f9fa" }}>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            fullWidth
            label="Nombre del archivo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Contrato firmado.pdf"
          />
          <TextField
            size="small"
            fullWidth
            label="URL del archivo o enlace"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
          />
          <Button
            variant="outlined"
            onClick={handleAgregar}
            startIcon={<Link2 size={18} />}
            sx={{ alignSelf: "flex-start" }}
            disabled={!nombre.trim() || !url.trim()}
          >
            Agregar Enlace
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        {adjuntos.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No hay archivos adjuntos.
            </Typography>
          </Box>
        ) : (
          <List dense>
            {adjuntos.map((adj) => (
              <ListItem key={adj.id} sx={{ borderBottom: "1px solid #eee" }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {getFileIcon(adj.tipo)} {adj.nombre}
                </Typography>
                <SafeChip label={adj.tipo} size="small" sx={{ mr: 1, fontSize: "0.65rem" }} />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    component="a"
                    href={adj.url}
                    target="_blank"
                    sx={{ mr: 1, color: "primary.main" }}
                  >
                    <Download size={16} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleEliminar(adj.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
