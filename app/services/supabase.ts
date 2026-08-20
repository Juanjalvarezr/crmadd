// Configuración de Supabase para DESEO DIGITAL
import { createClient } from '@supabase/supabase-js';
import * as z from 'zod';
import type { Cliente } from '../types/crm';

// Punto 1: Esquemas de Validación en Runtime
export const ClienteSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().optional(),
  empresa: z.string().optional(),
  nicho: z.string().optional(),
  estado: z.enum(["Activo", "Inactivo"]).default("Activo"),
  dolores: z.string().optional(), // Corregido: estaba duplicado
  necesidades: z.string().optional(),
  favorito: z.boolean().optional().default(false),
});

// ⚠️ NOTA: Estos valores son de ejemplo. Necesitas crear tu proyecto en Supabase.
// Ve a https://supabase.com, crea cuenta gratuita, y obtén tu URL y KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Advertencia: Faltan las credenciales de Supabase. La aplicación usará placeholders.");
}

// Cliente de Supabase
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder-project.supabase.co', 
  SUPABASE_ANON_KEY || 'public-anon-key-placeholder',
  {
    auth: { persistSession: true },
    global: { headers: { 'x-application-name': 'crm-agencia' } }
  }
);

// Tipos para las tablas
export type Tables = {
  clientes: {
    id: number;
    nombre: string;
    email: string;
    telefono: string;
    empresa?: string;
    nicho?: string;
    origen?: string; // n8n, Instagram, Ads, Referido
    dolores?: string; // Problemas actuales del cliente
    necesidades?: string; // Qué busca resolver
    intereses?: string; // Qué servicios le llamaron la atención
    estado: "Activo" | "Inactivo";
    ultima_interaccion: string;
    created_at: string;
  };
  oportunidades: {
    id: number;
    nombre: string;
    cliente_id?: number;
    cliente_nombre?: string;
    valor: number;
    servicios_interes?: string[];
    fecha_cierre_esperada?: string;
    etapa: string;
    probabilidad: number;
    estado: string; // "Abierta", "Cerrada", "Perdida"
    created_at: string;
  };
  tareas: {
    id: number; // Corregido: estaba como string en algunos lugares
    titulo: string;
    descripcion: string;
    fecha: string;
    prioridad: "Baja" | "Media" | "Alta";
    estado: "Pendiente" | "En progreso" | "Completada";
    tipo: "Tarea" | "Cita" | "Llamada" | "Seguimiento"; // Nuevo campo
    link_reunion?: string; // Nuevo campo
    created_at: string; // Corregido: estaba como string en algunos lugares
    proyecto_id?: string;
    oportunidad_id?: number;
    cliente_id?: number;
    responsable_id?: number; // Referencia a la tabla 'equipo'
  };
  servicios: { // Ya existente
    id: number;
    nombre: string;
    categoria: string;
    descripcion: string;
    precio_base: number;
    duracion: string;
    incluye: string[];
    estado: "Activo" | "Inactivo";
    popularidad: number;
    created_at: string;
  }; // Corregido: estaba como string en algunos lugares
  equipo: { // Renombrado de 'subagentes'
    id: number;
    nombre: string;
    email: string;
    rol: "Admin" | "Soporte" | "Técnico" | "Creativo";
    especialidad: string;
    estado: "Activo" | "Inactivo";
    created_at: string; // Corregido: estaba como string en algunos lugares
  };
  proyectos: { // Ya existente
    id: string;
    nombre: string;
    descripcion: string;
    cliente_id?: number;
    cliente_nombre?: string;
    servicios: string[]; // Corregido: estaba como string en algunos lugares
    oportunidad_id?: number; // Para trazabilidad desde la venta
    estado: string;
    prioridad: string;
    fecha_inicio: string;
    fecha_fin: string;
    progreso: number;
    presupuesto: number;
    costo_actual: number; // Corregido: estaba como string en algunos lugares
    tareas: any[];
    recursos: any[];
    monto_pagado: number; // Para rastrear el 50% inicial
    onboarding_checklist: any; // Checkbox de contraseñas, accesos, etc.
    estado_pago: "pendiente" | "parcial" | "pagado" | "vencido";
    metodo_pago?: "nequi" | "daviplata" | "transferencia" | "efectivo";
    fase_administrativa: "propuesta" | "contrato" | "onboarding" | "operacion" | "capacitacion" | "renovacion";
    plan_contenido: any; // Para Reels, Stories e ideas
    creado_en: string;
    actualizado_en: string; // Corregido: estaba como string en algunos lugares
  };
  campanas_email: { // Ya existente
    id: string;
    nombre: string;
    asunto: string;
    contenido: string;
    tipo: string;
    destinatarios: string[];
    fecha_envio: string | null;
    estado: string; // Corregido: estaba como string en algunos lugares
    estadisticas: any;
    created_at: string;
  };
  plantillas_email: { // Ya existente
    id: string;
    nombre: string;
    asunto: string;
    contenido: string;
    categoria: string;
    usos: number; // Corregido: estaba como string en algunos lugares
  };
  configuracion_empresa: { // Ya existente
    id: number;
    nombre_agencia: string;
    email_contacto?: string;
    telefono?: string;
    website?: string;
    logo_url?: string;
    colores?: any;
    descripcion?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string; // Corregido: estaba como string en algunos lugares
    actualizado_en: string;
    google_business_link?: string;
  };
  reglas_negocio_ai: { // Ya existente
    id: number;
    categoria: string;
    instruccion: string;
    actualizado_en: string; // Corregido: estaba como string en algunos lugares
  };
  conocimiento_agencia: {
    id: number;
    titulo: string;
    contenido: string;
    categoria: string;
    tags?: string[];
    embedding?: number[]; // Corregido: estaba como string en algunos lugares
    actualizado_en: string;
  };
  interacciones: { // Nueva tabla
    id: number;
    cliente_id?: number;
    tipo: "Email" | "WhatsApp" | "Nota" | "Cita";
    asunto?: string;
    contenido: string; // Corregido: estaba como string en algunos lugares
    usuario: string;
    created_at: string;
  };
  prompts_ai: {
    id: string;
    slug: string;
    system_prompt: string;
    user_prompt_template: string;
    version: number;
    actualizado_en: string;
  };
  facturas: {
    id: number;
    numero_factura?: string;
    proyecto_id?: string;
    cliente_id?: number;
    estado: "Borrador" | "Enviada" | "Pagada" | "Vencida" | "Anulada";
    total: number;
    subtotal?: number;
    iva?: number;
    descuento?: number;
    metodo_pago?: "nequi" | "daviplata" | "transferencia" | "efectivo";
    notas?: string;
    fecha_emision?: string;
    fecha_vencimiento?: string;
    created_at: string;
    updated_at: string;
  };
  cotizaciones: {
    id: number;
    numero_cotizacion?: string;
    proyecto_id?: string;
    cliente_id?: number;
    estado: "Borrador" | "Enviada" | "Aceptada" | "Rechazada" | "Vencida";
    total: number;
    subtotal?: number;
    iva?: number;
    descuento?: number;
    notas?: string;
    fecha_emision?: string;
    fecha_vencimiento?: string;
    created_at: string;
    updated_at: string;
  };
  plantillas_documentos: {
    id: number;
    tipo: "cotizacion" | "factura" | "contrato" | "recibo";
    nombre: string;
    contenido: string;
    logo_url?: string;
    color_primario?: string;
    color_secundario?: string;
    iva_porcentaje?: number;
    valores_por_defecto?: any;
    activo?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  pagos: {
    id: number;
    factura_id: number;
    monto: number;
    fecha_pago?: string;
    metodo_pago?: "nequi" | "daviplata" | "transferencia" | "efectivo";
    referencia?: string;
    comprobante_url?: string;
    created_at?: string;
    updated_at?: string;
  };
  contratos: {
    id: number;
    proyecto_id?: string;
    cliente_id?: number;
    factura_id?: number;
    estado: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    valor: number;
    url?: string;
    created_at: string;
    updated_at: string;
  };
};

// Servicios
export const serviciosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('popularidad', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      precio_base: Number(s.precio_base || 0)
    }));
  },

  async create(servicio: Omit<Tables['servicios'], 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('servicios')
      .insert([servicio])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, servicio: Partial<Tables['servicios']>) {
    const { data, error } = await supabase
      .from('servicios')
      .update(servicio)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Tareas
export const tareasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('fecha', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(tarea: Omit<Tables['tareas'], 'id' | 'created_at'>) {
    const { data, error } = await supabase // Corregido: estaba como string en algunos lugares
      .from('tareas')
      .insert([tarea])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, tarea: Partial<Tables['tareas'] & { responsable_id?: number }>) {
    const { data, error } = await supabase // Corregido: estaba como string en algunos lugares
      .from('tareas')
      .update(tarea)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('tareas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
};

const mapDBToEmpresa = (e: any) => ({
  nombre: e.nombre_agencia,
  logo: e.logo_url,
  email: e.email_contacto,
  telefono: e.telefono,
  website: e.website,
  direccion: e.direccion,
  ciudad: e.ciudad,
  pais: e.pais,
  descripcion: e.descripcion,
  colores: e.colores,
  actualizadoEn: e.actualizado_en,
  googleBusinessLink: e.google_business_link
});

const mapEmpresaToDB = (e: any) => ({
  nombre_agencia: e.nombre,
  logo_url: e.logo,
  email_contacto: e.email,
  telefono: e.telefono,
  website: e.website,
  direccion: e.direccion,
  ciudad: e.ciudad,
  pais: e.pais,
  descripcion: e.descripcion,
  colores: e.colores,
  google_business_link: e.googleBusinessLink
});

const mapDBToCampana = (c: any) => ({
  id: c.id,
  nombre: c.nombre,
  asunto: c.asunto,
  contenido: c.contenido,
  tipo: c.tipo,
  destinatarios: c.destinatarios || [],
  fechaEnvio: c.fecha_envio,
  estado: c.estado,
  estadisticas: c.estadisticas || {},
  creadoEn: c.created_at
});

const mapCampanaToDB = (c: any) => ({
  nombre: c.nombre,
  asunto: c.asunto,
  contenido: c.contenido,
  tipo: c.tipo,
  destinatarios: c.destinatarios,
  fecha_envio: c.fechaEnvio || null,
  estado: c.estado,
  estadisticas: c.estadisticas || {},
});

// Mapeos para Clientes (Sincronizados con database_fix.sql)
export const mapDBToCliente = (c: any) => ({
  id: c.id,
  nombre: c.nombre,
  email: c.email,
  telefono: c.telefono,
  empresa: c.empresa,
  nicho: c.nicho,
  origen: c.origen,
  dolores: c.dolores,
  necesidades: c.necesidades,
  intereses: c.intereses,
  estado: c.estado,
  ultima_interaccion: c.ultima_interaccion,
  createdAt: c.created_at,
  favorito: !!c.favorito,
});

export const mapClienteToDB = (c: any) => ({
  nombre: c.nombre,
  email: c.email,
  telefono: c.telefono,
  empresa: c.empresa,
  nicho: c.nicho,
  origen: c.origen,
  dolores: c.dolores,
  necesidades: c.necesidades,
  intereses: c.intereses,
  estado: c.estado,
  ultima_interaccion: c.ultimaInteraccion,
  favorito: c.favorito
});

// Mapeos para Proyectos (Sincronizados con database_fix.sql)
export const mapDBToProyecto = (p: any) => ({
  id: p.id,
  nombre: p.nombre,
  descripcion: p.descripcion,
  clienteId: p.cliente_id,
  clienteNombre: p.cliente_nombre,
  servicios: p.servicios || [],
  oportunidadId: p.oportunidad_id,
  estado: p.estado,
  prioridad: p.prioridad,
  fechaInicio: p.fecha_inicio,
  fechaFin: p.fecha_fin,
  progreso: p.progreso,
  presupuesto: Number(p.presupuesto || 0),
  costoActual: Number(p.costo_actual || 0),
  tareas: p.tareas || [],
  recursos: p.recursos || [],
  montoPagado: Number(p.monto_pagado || 0),
  onboardingChecklist: p.onboarding_checklist || {},
  estadoPago: p.estado_pago,
  metodoPago: p.metodo_pago,
  faseAdministrativa: p.fase_administrativa,
  planContenido: p.plan_contenido || { reels: [], stories: [], pauta: [] },
  creadoEn: p.creado_en,
  actualizadoEn: p.actualizado_en
});

export const mapProyectoToDB = (p: any) => ({
  nombre: p.nombre,
  descripcion: p.descripcion,
  cliente_id: p.clienteId,
  cliente_nombre: p.clienteNombre,
  servicios: p.servicios,
  oportunidad_id: p.oportunidadId,
  estado: p.estado,
  prioridad: p.prioridad,
  fecha_inicio: p.fechaInicio,
  fecha_fin: p.fechaFin,
  progreso: p.progreso,
  presupuesto: p.presupuesto,
  costo_actual: p.costoActual,
  tareas: p.tareas,
  recursos: p.recursos,
  monto_pagado: p.montoPagado,
  onboarding_checklist: p.onboardingChecklist,
  estado_pago: p.estadoPago,
  metodo_pago: p.metodoPago,
  fase_administrativa: p.faseAdministrativa,
  plan_contenido: p.planContenido,
  actualizado_en: p.actualizadoEn || new Date().toISOString()
});

// --- Servicio de Clientes ---
export const clientesService = {
  async getAll(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre');
    if (error) {
      console.error("Error crítico cargando clientes:", error);
      return [];
    }
    return (data || []).map(mapDBToCliente);
  },
  async create(cliente: Partial<Cliente>): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .insert([mapClienteToDB(cliente)])
      .select()
      .single();
    if (error) throw error;
    return data ? mapDBToCliente(data) : null;
  },
  async update(id: number, updates: any) {
    // Identidad: Si cambia el nombre, sincronizamos proyectos y oportunidades // Corregido: estaba como string en algunos lugares
    if (updates.nombre) {
      await Promise.all([
        supabase.from('proyectos').update({ cliente_nombre: updates.nombre }).eq('cliente_id', id),
        supabase.from('oportunidades').update({ cliente_nombre: updates.nombre }).eq('cliente_id', id)
      ]);
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(mapClienteToDB(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return mapDBToCliente(data);
  },
  async delete(id: number) {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// --- Servicio de Oportunidades ---
export const oportunidadesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('oportunidades')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error("Error crítico cargando ventas:", error);
      return [];
    }
    return data || [];
  },
  async create(opp: any) {
    const { data, error } = await supabase.from('oportunidades').insert([opp]).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: number, updates: any) {
    const { data, error } = await supabase.from('oportunidades').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase.from('oportunidades').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// --- Servicio de Proyectos ---
export const proyectosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .order('actualizado_en', { ascending: false });
    if (error) {
      console.error("Error crítico cargando proyectos:", error);
      return [];
    }
    return (data || []).map(mapDBToProyecto);
  },
  async getById(id: string) {
    const { data, error } = await supabase.from('proyectos').select('*').eq('id', id).single();
    if (error) throw error;
    return data ? mapDBToProyecto(data) : null;
  },
  async create(proyecto: any) {
    const { data, error } = await supabase
      .from('proyectos')
      .insert([mapProyectoToDB(proyecto)])
      .select()
      .single();
    if (error) throw error;
    return mapDBToProyecto(data);
  },
  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('proyectos').update(mapProyectoToDB(updates)).eq('id', id).select().single();
    if (error) throw error;
    return mapDBToProyecto(data);
  },
  async delete(id: string) {
    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Subagentes (Equipo Técnico)
/*
export const subagentesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('subagentes')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || []; // Corregido: estaba como string en algunos lugares
  },
  async create(subagente: Omit<Tables['subagentes'], 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('subagentes')
      .insert([subagente])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: number, updates: Partial<Tables['subagentes']>) {
    const { data, error } = await supabase
      .from('subagentes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase
      .from('subagentes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
*/
export const subagentesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('equipo') // Usar la tabla 'equipo' según el README
      .select('*')
      .order('nombre', { ascending: true });
    if (error) {
      console.error("Error cargando equipo:", error);
      return [];
    }
    return data || [];
  },
  async create(subagente: Omit<Tables['equipo'], 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('equipo')
      .insert([subagente])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: number, updates: Partial<Tables['equipo']>) {
    const { data, error } = await supabase
      .from('equipo')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase
      .from('equipo')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Servicio de Interacciones (Nuevo)
export const interaccionesService = {
  async create(interaccion: Omit<Tables['interacciones'], 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('interacciones')
      .insert([interaccion])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  // Puedes añadir más métodos como getAllByCliente, etc.
};


// --- Registro de Auditoría ---
export const logsService = {
  async create(log: { accion: string, modulo: string, detalle: any, usuario: string }) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{ 
          ...log, 
          // Punto 5: Snapshot detallado
          detalle: typeof log.detalle === 'string' ? log.detalle : JSON.stringify(log.detalle),
          created_at: new Date().toISOString() 
        }]);
      if (error) throw error;
      return data;
    } catch (e) { console.error("Error guardando log:", e); }
  }
};

export const emailService = {
  async getCampanas() {
    const { data, error } = await supabase
      .from('campanas_email')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToCampana);
  },
  async createCampana(campana: any) {
    const { data, error } = await supabase
      .from('campanas_email')
      .insert([mapCampanaToDB(campana)])
      .select()
      .single();
    if (error) throw error;
    return mapDBToCampana(data);
  },
  async updateCampana(id: string, updates: any) {
    const { data, error } = await supabase
      .from('campanas_email')
      .update(mapCampanaToDB(updates))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapDBToCampana(data);
  },
  async deleteCampana(id: string) {
    const { error } = await supabase
      .from('campanas_email')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
  async getPlantillas() {
    const { data, error } = await supabase
      .from('plantillas_email')
      .select('*');
    if (error) throw error;
    return data || [];
  },
  async createPlantilla(plantilla: any) {
    const { data, error } = await supabase
      .from('plantillas_email')
      .insert([plantilla])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async sendRealEmail(to: string[], subject: string, html: string, attachments?: { filename: string; content?: string; path?: string }[]) {
    const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
    if (!RESEND_API_KEY || RESEND_API_KEY === 'tu-llave-de-resend') {
      console.warn("Simulando envío de email (falta API Key de Resend)");
      return { id: 'simulated-id', message: 'Email simulado correctamente' };
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ 
        from: 'DESEO DIGITAL <onboarding@resend.dev>', 
        to, 
        subject, 
        html,
        attachments
      }),
    });
    return response.json();
  }
};

// Configuración Service
export const configuracionService = {
  async getEmpresa() {
    try {
      const { data, error } = await supabase
        .from('configuracion_empresa')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapDBToEmpresa(data) : null;
    } catch (e) {
      console.warn("No se pudo cargar la configuración de empresa:", e);
      return null;
    }
  },
  async updateEmpresa(config: any) {
    const dbConfig = mapEmpresaToDB(config);
    const { data: existing } = await supabase
      .from('configuracion_empresa')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    let query;
    if (existing?.id) {
      query = supabase.from('configuracion_empresa')
        .update({ ...dbConfig, actualizado_en: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      query = supabase.from('configuracion_empresa')
        .insert([{ ...dbConfig, actualizado_en: new Date().toISOString() }]);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return mapDBToEmpresa(data);
  },
  async uploadLogo(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `agency-logos/${fileName}`;
    return await storageUpload('config', filePath, file);
  }
};

const storageUpload = async (bucket: string, path: string, file: File) => {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

export const storageHelper = {
  async upload(bucket: string, path: string, file: File) {
    return await storageUpload(bucket, path, file);
  }
};

// Servicio para el Cerebro de la IA
export const reglasAIService = {
  async getAll() {
    const { data, error } = await supabase
      .from('reglas_negocio_ai')
      .select('*')
      .order('actualizado_en', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async create(regla: { categoria: string, instruccion: string }) {
    const { data, error } = await supabase
      .from('reglas_negocio_ai')
      .insert([regla])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase
      .from('reglas_negocio_ai')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Punto 8: Servicio de Prompts Dinámicos
export const documentosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async create(payload: any) {
    const { data, error } = await supabase
      .from('documentos')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: string) {
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
  async upload(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `doc-${Date.now()}.${fileExt}`;
    const filePath = `crm-documents/${fileName}`;
    return await storageUpload('crm-documents', filePath, file);
  }
};

export const promptsAIService = {
  async getBySlug(slug: string) {
    const { data } = await supabase
      .from('prompts_ai')
      .select('*')
      .eq('slug', slug)
      .single();
    return data;
  },
  async getAll() {
    const { data, error } = await supabase
      .from('prompts_ai')
      .select('*')
      .order('slug', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async update(id: string, updates: Partial<Tables['prompts_ai']>) {
    const { data, error } = await supabase
      .from('prompts_ai')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Servicio de Conocimiento
export const conocimientoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('conocimiento_agencia')
      .select('*')
      .order('categoria', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async buscarSemantico(embedding: number[]) {
    const { data, error } = await supabase.rpc('buscar_conocimiento', {
      query_embedding: embedding,
      match_threshold: 0.5, // Similitud mínima del 50%
      match_count: 5,        // Traer los 5 mejores resultados
    });
    if (error) throw error;
    return data || [];
  },
  async create(item: Omit<Tables['conocimiento_agencia'], 'id' | 'actualizado_en'>) {
    const { data, error } = await supabase
      .from('conocimiento_agencia')
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase.from('conocimiento_agencia').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Helper para Auth (Siguiente paso crítico)
export const authService = {
  async signUp(email: string, pass: string) {
    return await supabase.auth.signUp({ email, password: pass });
  },
  async signIn(email: string, pass: string) {
    return await supabase.auth.signInWithPassword({ email, password: pass });
  },
  async signOut() {
    return await supabase.auth.signOut();
  }
};

// Verificar conexión
export async function testConnection() {
  try {
    await supabase.from('clientes').select('count', { count: 'exact', head: true });
    return { success: true, message: 'Conexión exitosa a Supabase' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- Servicio de Facturas ---
export const facturasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .order('fecha_emision', { ascending: false });
    if (error) throw error;
    return (data || []).map((f: any) => ({ ...f, total: Number(f.total || 0) }));
  },
  async create(factura: Omit<Tables['facturas'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('facturas')
      .insert([{ ...factura, fecha_emision: factura.fecha_emision || new Date().toISOString(), updated_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: number, updates: Partial<Tables['facturas']>) {
    const { data, error } = await supabase
      .from('facturas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase.from('facturas').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

// --- Servicio de Cotizaciones ---
export const cotizacionesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('fecha_emision', { ascending: false });
    if (error) throw error;
    return (data || []).map((c: any) => ({ ...c, total: Number(c.total || 0) }));
  },
  async create(cotizacion: Omit<Tables['cotizaciones'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .insert([{ ...cotizacion, fecha_emision: cotizacion.fecha_emision || new Date().toISOString(), updated_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: number, updates: Partial<Tables['cotizaciones']>) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

// --- Servicio de Plantillas de Documentos ---
export const plantillasDocumentosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('plantillas_documentos')
      .select('*')
      .order('tipo', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async getByTipo(tipo: Tables['plantillas_documentos']['tipo']) {
    const { data, error } = await supabase
      .from('plantillas_documentos')
      .select('*')
      .eq('tipo', tipo)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async upsert(template: Omit<Tables['plantillas_documentos'], 'id' | 'created_at' | 'updated_at'> & { id?: number }) {
    const payload = { ...template, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('plantillas_documentos')
      .upsert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async remove(id: number) {
    const { error } = await supabase.from('plantillas_documentos').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

// --- Servicio de Pagos ---
export const pagosService = {
  async getByFactura(factura_id: number) {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('factura_id', factura_id)
      .order('fecha_pago', { ascending: false });
    if (error) throw error;
    return (data || []).map((p: any) => ({ ...p, monto: Number(p.monto || 0) }));
  },
  async create(pago: Omit<Tables['pagos'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('pagos')
      .insert([{ ...pago, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: number, updates: Partial<Tables['pagos']>) {
    const { data, error } = await supabase
      .from('pagos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase.from('pagos').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

// --- Servicio de Contratos ---
export const contratosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .order('fecha_inicio', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async create(contrato: Omit<Tables['contratos'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('contratos')
      .insert([{ ...contrato, updated_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: number, updates: Partial<Tables['contratos']>) {
    const { data, error } = await supabase
      .from('contratos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: number) {
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

interface BriefItem {
  id: number;
  proyecto_id?: string | null;
  cliente_id?: number | null;
  titulo: string;
  estado: string;
  created_at?: string;
  updated_at?: string;
}
interface SopItem {
  id: number;
  titulo: string;
  descripcion?: string;
  categoria?: string;
  created_at?: string;
  updated_at?: string;
}

// --- Servicio de Briefs ---
export const briefsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data || []) as BriefItem[];
  },
  async create(item: Omit<BriefItem, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('briefs')
      .insert([{ ...item, actualizado_en: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return data as BriefItem;
  },
  async update(id: number, updates: Partial<BriefItem>) {
    const { data, error } = await supabase
      .from('briefs')
      .update({ ...updates, actualizado_en: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as BriefItem;
  },
};

// --- Servicio de SOPs ---
export const sopsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sops')
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data || []) as SopItem[];
  },
  async create(item: Omit<SopItem, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('sops')
      .insert([{ ...item, actualizado_en: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return data as SopItem;
  },
  async update(id: number, updates: Partial<SopItem>) {
    const { data, error } = await supabase
      .from('sops')
      .update({ ...updates, actualizado_en: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as SopItem;
  },
};

// --- Servicio de Eventos de Calendario ---
export const calendarEventsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start', { ascending: true });
    if (error) throw error;
    return (data || []).map((e: any) => ({
      ...e,
      start: new Date(e.start),
      end: e.end ? new Date(e.end) : new Date(e.start),
    }));
  },
  async create(event: any) {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([event])
      .select()
      .single();
    if (error) throw error;
    return { ...data, start: new Date(data.start), end: data.end ? new Date(data.end) : new Date(data.start) };
  },
  async update(id: string | number, updates: any) {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, start: new Date(data.start), end: data.end ? new Date(data.end) : new Date(data.start) };
  },
  async delete(id: string | number) {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
};

export const transaccionesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return (data || []).map((t: any) => ({ ...t, monto: Number(t.monto || 0) }));
  },
  async create(transaccion: any) {
    const { data, error } = await supabase
      .from('transacciones')
      .insert([{ ...transaccion, updated_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return { ...data, monto: Number(data.monto || 0) };
  },
  async update(id: number, updates: any) {
    const { data, error } = await supabase
      .from('transacciones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, monto: Number(data.monto || 0) };
  },
  async delete(id: number) {
    const { error } = await supabase.from('transacciones').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
