export interface Cliente {
  id?: number;
  nombre?: string;
  email?: string;
  telefono?: string;
  empresa?: string;
  nicho?: string;
  estado?: string;
  origen?: string;
  dolores?: string;
  necesidades?: string;
  intereses?: string;
  ultima_interaccion?: string;
  favorito?: boolean;
}

export interface Prospecto {
  id: number;
  codigo: string;
  nombre: string;
  tipo_negocio?: string;
  descripcion?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ubicacion?: string;
  origen?: string;
  fecha_extraccion?: string;
  estado: string;
  fecha_visita?: string;
  fecha_cita?: string;
  notas_visita?: string;
  necesidades?: string;
  solucion_propuesta?: string;
  servicios?: any[];
  precio_estimado?: number;
  proximo_contacto?: string;
  ultima_interaccion?: string;
  es_prospecto?: boolean;
  listo_contactar?: boolean;
  canal_preferido?: string;
  creado_en?: string;
  persona_contacto?: string;
  mensaje_enviado?: string;
  ultimo_mensaje?: string;
  categoria?: string;
  rating?: number;
  opiniones?: number;
}

export interface EnlaceDocumento {
  id: number;
  titulo: string;
  url: string;
  tipo_documento?: string;
  prospecto_id?: number;
  cliente_id?: number;
  creado_en?: string;
}

export type EstadoProspecto =
  | 'Nuevo'
  | 'Pendiente'
  | 'Contactado'
  | 'En Revisión'
  | 'Propuesta'
  | 'Cotización'
  | 'Contratos'
  | 'Facturación'
  | 'Cliente'
  | 'Perdido';

export const ESTADOS_PROGRESS: Record<EstadoProspecto, number> = {
  Nuevo: 5,
  Pendiente: 15,
  Contactado: 25,
  'En Revisión': 40,
  Propuesta: 55,
  Cotización: 70,
  Contratos: 85,
  Facturación: 95,
  Cliente: 100,
  Perdido: 0,
};

export const ESTADO_COLORS: Record<EstadoProspecto, 'success' | 'info' | 'warning' | 'error' | 'primary' | 'secondary'> = {
  Nuevo: 'success',
  Pendiente: 'info',
  Contactado: 'primary',
  'En Revisión': 'warning',
  Propuesta: 'warning',
  Cotización: 'warning',
  Contratos: 'info',
  Facturación: 'info',
  Cliente: 'success',
  Perdido: 'error',
};

export interface Proyecto {
  id?: number | string;
  nombre?: string;
  descripcion?: string;
  estado?: 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  faseAdministrativa?: string;
  cliente_id?: number;
  prospecto_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  [key: string]: any;
}

export interface TareaProyecto {
  id?: number | string;
  proyecto_id?: number | string;
  titulo?: string;
  estado?: string;
  [key: string]: any;
}

export interface RecursoProyecto {
  id?: number | string;
  proyecto_id?: number | string;
  nombre?: string;
  [key: string]: any;
}

export interface PlanItem {
  id?: number | string;
  [key: string]: any;
}

export interface Oportunidad {
  id?: number | string;
  nombre?: string;
  cliente_id?: number;
  etapa?: 'Prospección' | 'Propuesta' | 'Negociación' | 'Cierre';
  probabilidad?: number;
  servicios_interes?: any[];
  [key: string]: any;
}
