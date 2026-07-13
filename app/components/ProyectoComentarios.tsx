import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, TextField, Button, List, ListItem, Avatar, Stack
} from "@mui/material";
import { Send, User } from "lucide-react";
import type { Proyecto } from "../types/crm";
import { safeReadJsonArray, safeWriteJson } from "../utils/safeStorage";

interface Comentario {
  id: string;
  proyectoId: string;
  autor: string;
  texto: string;
  fecha: string;
}

const STORAGE_KEY = "crm_proyecto_comentarios";

function cargarComentarios(proyectoId: string): Comentario[] {
  return safeReadJsonArray<Comentario>(`${STORAGE_KEY}_${proyectoId}`);
}

function guardarComentarios(proyectoId: string, comentarios: Comentario[]) {
  safeWriteJson(`${STORAGE_KEY}_${proyectoId}`, comentarios);
}

interface ProyectoComentariosProps {
  proyecto: Proyecto;
}

export function ProyectoComentarios({ proyecto }: ProyectoComentariosProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");

  useEffect(() => {
    setComentarios(cargarComentarios(proyecto.id));
  }, [proyecto.id]);

  const handleComentar = () => {
    if (!nuevoComentario.trim()) return;
    const comentario: Comentario = {
      id: Date.now().toString(),
      proyectoId: proyecto.id,
      autor: "Juan José Álvarez",
      texto: nuevoComentario.trim(),
      fecha: new Date().toISOString()
    };
    const nuevos = [...comentarios, comentario];
    setComentarios(nuevos);
    guardarComentarios(proyecto.id, nuevos);
    setNuevoComentario("");
  };

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
        💬 Comentarios del Proyecto
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Escribe un comentario..."
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleComentar()}
        />
        <Button
          variant="contained"
          onClick={handleComentar}
          startIcon={<Send size={18} />}
          sx={{ bgcolor: "#e91e63", "&:hover": { bgcolor: "#c2185b" } }}
          disabled={!nuevoComentario.trim()}
        >
          Enviar
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ maxHeight: 300, overflow: "auto" }}>
        {comentarios.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No hay comentarios aún. Sé el primero en comentar.
            </Typography>
          </Box>
        ) : (
          <List dense>
            {comentarios.map((c) => (
              <ListItem key={c.id} sx={{ borderBottom: "1px solid #eee" }}>
                <Avatar sx={{ mr: 2, bgcolor: "#e91e63", width: 32, height: 32 }}>
                  <User size={16} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                      {c.autor}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.fecha).toLocaleString("es-CO")}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{c.texto}</Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
