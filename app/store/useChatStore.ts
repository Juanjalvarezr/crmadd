import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { proyectosService } from '../services/database';
import { z } from 'zod';

export interface Mensaje {
  id: string;
  texto: string;
  tipo: "usuario" | "bot";
  timestamp: string; // Guardamos como ISO string para persistencia
  estado: "enviado" | "recibido" | "leyendo";
}

export interface ProposalInput {
  clienteNombre: string;
  clienteEmpresa: string;
  servicios: string[];
  notasAdicionales: string;
}

// Esquema de validación para evitar errores silenciosos
export const ProposalSchema = z.object({
  clienteNombre: z.string().min(2, "El nombre del cliente es obligatorio"),
  clienteEmpresa: z.string().min(2, "La empresa es obligatoria"),
  servicios: z.array(z.string()).min(1, "Debes seleccionar al menos un servicio"),
  notasAdicionales: z.string().optional(),
});

interface ChatState {
  // Historial del Chatbot (WhatsApp style)
  mensajes: Mensaje[];
  addMensaje: (texto: string, tipo: "usuario" | "bot") => void;
  clearMensajes: () => void;
  
  // Estado del Asistente de Propuestas
  proposalInput: ProposalInput;
  setProposalInput: (input: Partial<ProposalInput>) => void;
  proposalResult: string;
  setProposalResult: (result: string) => void;
  
  // UI Centralizada
  isAssistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  
  // Auditoría de Costos
  tokensConsumidos: number;
  addTokens: (count: number) => void;

  // Acciones de Persistencia
  saveProposalAsProject: () => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      mensajes: [],
      addMensaje: (texto, tipo) => set((state) => ({
        mensajes: [...state.mensajes, {
          id: Date.now().toString(),
          texto,
          tipo,
          timestamp: new Date().toISOString(),
          estado: tipo === "usuario" ? "enviado" : "recibido"
        }]
      })),
      clearMensajes: () => set({ mensajes: [] }),

      proposalInput: { clienteNombre: '', clienteEmpresa: '', servicios: [], notasAdicionales: '' },
      setProposalInput: (input) => set((state) => ({
        proposalInput: { ...state.proposalInput, ...input }
      })),
      
      proposalResult: '',
      setProposalResult: (result) => set({ proposalResult: result }),

      isAssistantOpen: false,
      setAssistantOpen: (open) => set({ isAssistantOpen: open }),

      tokensConsumidos: 0,
      addTokens: (count) => set((state) => ({ tokensConsumidos: state.tokensConsumidos + count })),

      saveProposalAsProject: async () => {
        const { proposalInput, proposalResult } = get();
        
        if (!proposalResult || !proposalInput.clienteEmpresa) return;

        try {
          await proyectosService.create({
            nombre: `Estrategia: ${proposalInput.clienteEmpresa}`,
            descripcion: proposalResult,
            clienteNombre: proposalInput.clienteNombre,
            servicios: proposalInput.servicios,
            estado: 'planificacion',
            prioridad: 'media',
            fechaInicio: new Date().toISOString().split('T')[0],
            fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progreso: 0,
            faseAdministrativa: 'onboarding',
            onboardingChecklist: { anticipo_50: false, analisis_presencia: false },
            tareas: []
          });
        } catch (error) {
          console.error("Error al guardar propuesta como proyecto:", error);
          throw error;
        }
      },
    }),
    { name: 'crm-chat-session', storage: createJSONStorage(() => localStorage) }
  )
);