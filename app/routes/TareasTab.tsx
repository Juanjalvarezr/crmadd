import React, { useState } from "react";
import { 
  Box, TextField, Button, List, ListItem, ListItemIcon, 
  ListItemText, ListItemSecondaryAction, IconButton, Typography 
} from "@mui/material";
import { Plus, CheckCircle, Play, Trash2 } from "lucide-react";
import type { Proyecto } from "../types/crm";

interface TareasTabProps {
  proyecto: Proyecto;
  onAddTarea: (nombre: string) => Promise<void>;
  onToggleTarea: (id: string) => Promise<void>;
  onDeleteTarea: (id: string) => Promise<void>;
}

/**
 * Componente extraído para gestionar la lista de tareas de un proyecto.
 * Maneja su propio estado local para el input de nueva tarea.
 */
export const TareasTab: React.FC<TareasTabProps> = ({ 
  proyecto, 
  onAddTarea, 
  onToggleTarea, 
  onDeleteTarea 
}) => {
  const [nuevaTareaNombre, setNuevaTareaNombre] = useState("");

  const handleAdd = () => {
    if (nuevaTareaNombre.trim()) {
      onAddTarea(nuevaTareaNombre);
      setNuevaTareaNombre("");
    }
  };

  return (
    <Box sx={{ py: 1 }}>
      {/* Input para nueva tarea */}
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <TextField 
          size="small" 
          fullWidth 
          placeholder="Nueva tarea para este proyecto..." 
          value={nuevaTareaNombre}
          onChange={(e) => setNuevaTareaNombre(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="contained" onClick={handleAdd} startIcon={<Plus size={18} />}>
          Añadir
        </Button>
      </Box>
      
      {/* Lista de tareas */}
      <List>
        {proyecto.tareas.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No hay tareas registradas para este proyecto.
          </Typography>
        ) : (
          proyecto.tareas.map((tarea) => (
            <ListItem 
              key={tarea.id} 
              divider
              sx={{ 
                backgroundColor: tarea.completada ? 'rgba(0,0,0,0.02)' : 'transparent',
                transition: '0.2s'
              }}
            >
              <ListItemIcon onClick={() => onToggleTarea(tarea.id)} sx={{ cursor: 'pointer' }}>
                {tarea.completada ? <CheckCircle color="#4caf50" size={20} /> : <Play color="#9e9e9e" size={20} />}
              </ListItemIcon>
              <ListItemText 
                primary={tarea.nombre} 
                secondary={`Límite: ${tarea.fechaLimite}`}
                sx={{ 
                  textDecoration: tarea.completada ? 'line-through' : 'none',
                  color: tarea.completada ? 'text.disabled' : 'text.primary'
                }}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  size="small" 
                  color="error"
                  onClick={() => onDeleteTarea(tarea.id)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
};