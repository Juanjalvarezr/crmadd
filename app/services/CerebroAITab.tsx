import React, { useState } from "react";
import {
  Box, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Divider, Chip, List, ListItem, ListItemText, ListItemIcon, Card, CardContent, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import SafeChip from "../components/SafeChip";
import { FiZap, FiPlus, FiTrash2, FiEdit, FiCheck, FiList, FiDollarSign } from "react-icons/fi";
import KnowledgeFileUploader from "./KnowledgeFileUploader";

interface CerebroAITabProps {
  reglasAI: any[];
  onAddRegla: (regla: { categoria: string; instruccion: string }) => Promise<void>;
  onDeleteRegla: (id: number) => Promise<void>;
  promptsAI: any[];
  onEditPrompt: (prompt: any) => void;
  conocimiento: any[];
  onAddConocimiento: (item: any) => Promise<void>;
  onDeleteConocimiento: (id: number) => Promise<void>;
  onRefreshConocimiento: () => void;
}

export const CerebroAITab: React.FC<CerebroAITabProps> = ({
  reglasAI, onAddRegla, onDeleteRegla, promptsAI, onEditPrompt, 
  conocimiento, onAddConocimiento, onDeleteConocimiento, onRefreshConocimiento
}) => {
  const [nuevaRegla, setNuevaRegla] = useState({ categoria: "estrategia", instruccion: "" });

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>🧠 Memoria de Estrategia AI</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define las reglas que el asistente usará para asesorarte.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Categoría</InputLabel>
          <Select 
            size="small"
            value={nuevaRegla.categoria} 
            onChange={(e) => setNuevaRegla({...nuevaRegla, categoria: e.target.value})}
          >
            <MenuItem value="estrategia">Estrategia</MenuItem>
            <MenuItem value="tono">Tono/Marca</MenuItem>
            <MenuItem value="feedback">Feedback</MenuItem>
          </Select>
        </FormControl>
        <TextField 
          fullWidth 
          size="small" 
          placeholder="Ej: Priorizar SEO sobre SEM para clientes de nicho salud." 
          value={nuevaRegla.instruccion}
          onChange={(e) => setNuevaRegla({...nuevaRegla, instruccion: e.target.value})}
        />
        <Button 
          variant="contained" 
          onClick={() => {
            onAddRegla(nuevaRegla);
            setNuevaRegla({ ...nuevaRegla, instruccion: "" });
          }} 
          startIcon={<FiPlus />}
        >
          Añadir
        </Button>
      </Box>

      <List sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}>
        {reglasAI.map((regla) => (
          <ListItem 
            key={regla.id}
            secondaryAction={
              <IconButton edge="end" color="error" onClick={() => onDeleteRegla(regla.id)}>
                <FiTrash2 size={16} />
              </IconButton>
            }
          >
            <ListItemIcon>
              <SafeChip label={regla.categoria} size="small" variant="outlined" color="primary" />
            </ListItemIcon>
            <ListItemText primary={regla.instruccion} />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>🤖 Roles y Personalidad</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {promptsAI.map((prompt) => (
          <Grid item xs={12} md={6} key={prompt.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {prompt.slug.replace(/_/g, ' ')}
                  </Typography>
                  <SafeChip label={`v${prompt.version}`} size="small" />
                </Box>
                <Button size="small" startIcon={<FiEdit />} onClick={() => onEditPrompt(prompt)}>
                  Editar Personalidad
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>🧬 ADN & Conocimiento</Typography>
      
      <Box sx={{ mb: 4 }}>
        <KnowledgeFileUploader onSuccess={onRefreshConocimiento} />
      </Box>

      <Grid container spacing={2}>
        {conocimiento.map((item) => (
          <Grid item xs={12} md={6} key={item.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <SafeChip label={item.categoria} size="small" color="secondary" />
                  <IconButton size="small" color="error" onClick={() => onDeleteConocimiento(item.id)}>
                    <FiTrash2 size={14} />
                  </IconButton>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{item.titulo}</Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    display: '-webkit-box', 
                    WebkitLineClamp: 3, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}
                >
                  {item.contenido}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};