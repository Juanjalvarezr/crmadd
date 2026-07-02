// Datos simulados para el CRM

// Tipos exportados
export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: "Activo" | "Inactivo";
  ultimaInteraccion: string;
}

export interface Oportunidad {
  id: number;
  nombre: string;
  cliente: string;
  valor: number;
  etapa: "Prospección" | "Propuesta" | "Negociación" | "Cierre";
  probabilidad: number;
}

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: "Baja" | "Media" | "Alta";
  estado: "Pendiente" | "En progreso" | "Completada";
}

export const mockDashboardStats = {
  totalClientes: 245,
  clientesNuevosEsteMes: 12,
  ventasEsteMes: 45000,
  conversionRate: 32,
  tasaGrowth: 18,
  activitiesThisWeek: 48,
};

export const mockSalesData = [
  { month: "Ene", sales: 40000, target: 50000 },
  { month: "Feb", sales: 45000, target: 50000 },
  { month: "Mar", sales: 35000, target: 50000 },
  { month: "Abr", sales: 50000, target: 50000 },
  { month: "May", sales: 48000, target: 50000 },
  { month: "Jun", sales: 60000, target: 50000 },
];

export const mockClientes = [
  { id: 1, nombre: "Empresa Tech Solutions", email: "contact@techsol.com", telefono: "555-1234", estado: "Activo", ultimaInteraccion: "2024-05-08" },
  { id: 2, nombre: "Marketing Digital Pro", email: "info@mdpro.com", telefono: "555-5678", estado: "Activo", ultimaInteraccion: "2024-05-07" },
  { id: 3, nombre: "Diseño Creativo Studio", email: "studio@diseno.com", telefono: "555-9012", estado: "Activo", ultimaInteraccion: "2024-05-06" },
  { id: 4, nombre: "Consultoría Empresarial", email: "info@consultoria.com", telefono: "555-3456", estado: "Inactivo", ultimaInteraccion: "2024-04-15" },
  { id: 5, nombre: "E-commerce Global", email: "sales@ecommerce.com", telefono: "555-7890", estado: "Activo", ultimaInteraccion: "2024-05-05" },
];

export const mockOportunidades = [
  { id: 1, nombre: "Proyecto Web Completo", cliente: "Empresa Tech Solutions", valor: 15000, etapa: "Propuesta", probabilidad: 75 },
  { id: 2, nombre: "Auditoría SEO", cliente: "Marketing Digital Pro", valor: 5000, etapa: "Negociación", probabilidad: 50 },
  { id: 3, nombre: "Rebranding", cliente: "Diseño Creativo Studio", valor: 12000, etapa: "Prospección", probabilidad: 25 },
  { id: 4, nombre: "Consultoría Estratégica", cliente: "E-commerce Global", valor: 20000, etapa: "Propuesta", probabilidad: 85 },
  { id: 5, nombre: "Mantenimiento Anual", cliente: "Consultoría Empresarial", valor: 8000, etapa: "Cierre", probabilidad: 95 },
];

export const mockTareas = [
  { id: 1, titulo: "Seguimiento cliente Tech Solutions", descripcion: "Llamada de seguimiento", fecha: "2024-05-10", prioridad: "Alta", estado: "Pendiente" },
  { id: 2, titulo: "Enviar propuesta a Marketing Digital", descripcion: "Propuesta de SEO", fecha: "2024-05-12", prioridad: "Alta", estado: "En progreso" },
  { id: 3, titulo: "Revisión de contrato", descripcion: "Revisar términos", fecha: "2024-05-15", prioridad: "Media", estado: "Pendiente" },
  { id: 4, titulo: "Presentación con cliente", descripcion: "Reunión virtual", fecha: "2024-05-13", prioridad: "Alta", estado: "Pendiente" },
];

export const mockUsuarios = [
  { id: 1, nombre: "Juan Pérez", email: "juan@agencia.com", rol: "Admin", avatar: "JP" },
  { id: 2, nombre: "María García", email: "maria@agencia.com", rol: "Vendedor", avatar: "MG" },
  { id: 3, nombre: "Carlos López", email: "carlos@agencia.com", rol: "Vendedor", avatar: "CL" },
];
