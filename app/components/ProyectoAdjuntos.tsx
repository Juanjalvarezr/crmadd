import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Paper, List, ListItem, IconButton, Button, ListItemSecondaryAction, Chip, TextField, Stack, CircularProgress
} from "@mui/material";
import { Download, Trash2, Paperclip, Link2, Upload } from "lucide-react";
import type { Proyecto } from "../types/crm";
import SafeChip from "../components/SafeChip";
import { uploadFileToStorage, deleteStorageFile, getPublicPDFUrl } from "../services/storage";
import { safeReadJsonArray, safeWriteJson } from "../utils/safeStorage";

interface Adjunto {
  id: string;
  proyectoId: string;
  nombre: string;
  url: string;
  path?: string;
  tipo: "documento" | "imagen" | "pdf" | "otro";
  tamanio?: string;
  subidoEn: string;
}

const STORAGE_KEY = "crm_proyecto_adjuntos";

function cargarAdjuntos(proyectoId: string): Adjunto[] {
  return safeReadJsonArray<Adjunto>(`${STORAGE_KEY}_${proyectoId}`);
}

function guardarAdjuntos(proyectoId: string, adjuntos: Adjunto[]) {
  safeWriteJson(`${STORAGE_KEY}_${proyectoId}`, adjuntos);
}

interface ProyectoAdjuntosProps {
  proyecto: Proyecto;
}

export function ProyectoAdjuntos({ proyecto }: ProyectoAdjuntosProps) {
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const result = await uploadFileToStorage(file, `proyectos/${proyecto.id}`);
      const tipo: Adjunto["tipo"] = file.type === "application/pdf" ? "pdf" : file.type.startsWith("image/") ? "imagen" : "documento";
      const adjunto: Adjunto = {
        id: Date.now().toString(),
        proyectoId: proyecto.id,
        nombre: file.name,
        url: result.url,
        path: result.path,
        tipo,
        tamanio: `${(file.size / 1024).toFixed(1)} KB`,
        subidoEn: new Date().toISOString()
      };
      const nuevos = [...adjuntos, adjunto];
      setAdjuntos(nuevos);
      guardarAdjuntos(proyecto.id, nuevos);
    } catch (err) {
      setError("Error subiendo archivo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleEliminar = async (id: string) => {
    const adjunto = adjuntos.find(a => a.id === id);
    const nuevos = adjuntos.filter(a => a.id !== id);
    setAdjuntos(nuevos);
    guardarAdjuntos(proyecto.id, nuevos);

    if (adjunto?.path) {
      try {
        await deleteStorageFile(adjunto.path);
      } catch {
        // Storage delete failed, but local record cleared
      }
    }
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

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "background.paper" }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={uploading ? <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Subiendo..." : "Subir archivo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx"
              hidden
              onChange={handleUpload}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
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
              size="small"
              onClick={handleAgregar}
              startIcon={<Link2 size={16} />}
              disabled={!nombre.trim() || !url.trim()}
            >
              Agregar Enlace
            </Button>
          </Box>
          {error && (
            <Typography variant="caption" sx={{ color: "error.main" }}>
              {error}
            </Typography>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined">
        {adjuntos.length === 0 ? (
          <Box sx={{ p: 2.5, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No hay archivos adjuntos.
            </Typography>
          </Box>
        ) : (
          <List dense>
            {adjuntos.map((adj) => (
              <ListItem key={adj.id} sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1, fontSize: "0.85rem" }}>
                  {getFileIcon(adj.tipo)} {adj.nombre}
                  {adj.tamanio && (
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
                      {adj.tamanio}
                    </Typography>
                  )}
                </Typography>
                <SafeChip label={adj.tipo} size="small" sx={{ mr: 1, fontSize: "0.65rem", height: 22 }} />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    component="a"
                    href={adj.url}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ mr: 0.5, color: "primary.main" }}
                  >
                    <Download size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleEliminar(adj.id)}
                  >
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
