import { supabase } from './supabase';
import { calculateClientScoreFromDB } from './leadScoring';

export interface WorkflowRule {
  id: string;
  nombre: string;
  descripcion: string;
  trigger: 'lead_score_high' | 'oportunidad_stalled' | 'tarea_vencida' | 'cliente_nuevo' | 'proyecto_completado';
  activo: boolean;
  condiciones: {
    lead_score_threshold?: number;
    dias_sin_actividad?: number;
    dias_vencimiento?: number;
  };
  acciones: {
    tipo: 'asignar_vendedor' | 'enviar_notificacion' | 'cambiar_estado' | 'crear_tarea' | 'enviar_whatsapp';
    parametros?: any;
  }[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  entidad_tipo: 'cliente' | 'oportunidad' | 'tarea' | 'proyecto';
  entidad_id: string;
  estado: 'pendiente' | 'ejecutada' | 'fallida';
  resultado?: any;
  error?: string;
  created_at: string;
  ejecutada_at?: string;
}

/**
 * Reglas predefinidas de automatización
 */
const WORKFLOW_RULES_PREDEFINIDAS: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    nombre: 'Asignar lead caliente a vendedor senior',
    descripcion: 'Cuando el lead score supera 80, asignar automáticamente a vendedor senior',
    trigger: 'lead_score_high',
    activo: true,
    condiciones: {
      lead_score_threshold: 80,
    },
    acciones: [
      {
        tipo: 'asignar_vendedor',
        parametros: { rol: 'senior' },
      },
      {
        tipo: 'enviar_notificacion',
        parametros: { mensaje: 'Lead caliente asignado para seguimiento prioritario' },
      },
    ],
  },
  {
    nombre: 'Alerta oportunidad estancada',
    descripcion: 'Cuando una oportunidad está en Negociación por más de 7 días',
    trigger: 'oportunidad_stalled',
    activo: true,
    condiciones: {
      dias_sin_actividad: 7,
    },
    acciones: [
      {
        tipo: 'enviar_notificacion',
        parametros: { mensaje: 'Oportunidad estancada requiere atención' },
      },
      {
        tipo: 'crear_tarea',
        parametros: { titulo: 'Seguimiento oportunidad estancada', prioridad: 'Alta' },
      },
    ],
  },
  {
    nombre: 'Notificación tarea vencida',
    descripcion: 'Cuando una tarea está vencida, enviar notificación por WhatsApp',
    trigger: 'tarea_vencida',
    activo: true,
    condiciones: {
      dias_vencimiento: 0,
    },
    acciones: [
      {
        tipo: 'enviar_whatsapp',
        parametros: { mensaje_template: 'tarea_vencida' },
      },
      {
        tipo: 'enviar_notificacion',
        parametros: { mensaje: 'Tarea vencida detectada' },
      },
    ],
  },
  {
    nombre: 'Bienvenida cliente nuevo',
    descripcion: 'Cuando se crea un cliente nuevo, enviar secuencia de bienvenida',
    trigger: 'cliente_nuevo',
    activo: true,
    condiciones: {},
    acciones: [
      {
        tipo: 'enviar_notificacion',
        parametros: { mensaje: 'Nuevo cliente registrado' },
      },
      {
        tipo: 'crear_tarea',
        parametros: { titulo: 'Llamada de bienvenida', prioridad: 'Media', dias_desde: 1 },
      },
    ],
  },
  {
    nombre: 'Cierre proyecto completado',
    descripcion: 'Cuando un proyecto se marca como completado',
    trigger: 'proyecto_completado',
    activo: true,
    condiciones: {},
    acciones: [
      {
        tipo: 'enviar_notificacion',
        parametros: { mensaje: 'Proyecto completado exitosamente' },
      },
      {
        tipo: 'cambiar_estado',
        parametros: { nuevo_estado: 'finalizado' },
      },
    ],
  },
];

/**
 * Inicializa las reglas de workflow en la base de datos
 */
export const inicializarWorkflowRules = async (): Promise<void> => {
  try {
    const { data: existingRules } = await supabase.from('workflow_rules').select('id');
    
    if (!existingRules || existingRules.length === 0) {
      // Insertar reglas predefinidas
      for (const rule of WORKFLOW_RULES_PREDEFINIDAS) {
        await supabase.from('workflow_rules').insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      console.log('Reglas de workflow inicializadas');
    }
  } catch (error) {
    console.error('Error inicializando workflow rules:', error);
  }
};

/**
 * Ejecuta una regla de workflow
 */
export const ejecutarWorkflowRule = async (
  rule: WorkflowRule,
  entidadTipo: WorkflowExecution['entidad_tipo'],
  entidadId: string
): Promise<WorkflowExecution> => {
  try {
    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflow_id: rule.id,
      entidad_tipo,
      entidad_id,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    };

    // Ejecutar acciones
    const resultados = [];
    for (const accion of rule.acciones) {
      try {
        const resultado = await ejecutarAccion(accion, entidadTipo, entidadId);
        resultados.push({ accion: accion.tipo, resultado });
      } catch (error: any) {
        resultados.push({ accion: accion.tipo, error: error.message });
      }
    }

    // Actualizar ejecución
    execution.estado = 'ejecutada';
    execution.resultado = resultados;
    execution.ejecutada_at = new Date().toISOString();

    await supabase.from('workflow_executions').insert(execution);

    return execution;
  } catch (error: any) {
    const failedExecution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflow_id: rule.id,
      entidad_tipo,
      entidad_id,
      estado: 'fallida',
      error: error.message,
      created_at: new Date().toISOString(),
    };

    await supabase.from('workflow_executions').insert(failedExecution);

    return failedExecution;
  }
};

/**
 * Ejecuta una acción individual
 */
const ejecutarAccion = async (
  accion: WorkflowRule['acciones'][0],
  entidadTipo: string,
  entidadId: string
): Promise<any> => {
  switch (accion.tipo) {
    case 'asignar_vendedor':
      // Lógica para asignar a vendedor senior
      return await asignarAVendedor(entidadId, accion.parametros?.rol);

    case 'enviar_notificacion':
      // Lógica para enviar notificación
      return await enviarNotificacion(accion.parametros?.mensaje);

    case 'cambiar_estado':
      // Lógica para cambiar estado
      return await cambiarEstado(entidadTipo, entidadId, accion.parametros?.nuevo_estado);

    case 'crear_tarea':
      // Lógica para crear tarea
      return await crearTareaDesdeWorkflow(entidadTipo, entidadId, accion.parametros);

    case 'enviar_whatsapp':
      // Lógica para enviar WhatsApp
      return await enviarWhatsAppWorkflow(entidadId, accion.parametros?.mensaje_template);

    default:
      throw new Error(`Tipo de acción desconocido: ${accion.tipo}`);
  }
};

/**
 * Asigna entidad a vendedor senior
 */
const asignarAVendedor = async (_entidadId: string, rol: string): Promise<any> => {
  // Implementación: buscar vendedor con rol específico y asignar
  console.log(`Asignando a vendedor ${rol}`);
  return { asignado: true, rol };
};

/**
 * Envía notificación
 */
const enviarNotificacion = async (mensaje: string): Promise<any> => {
  // Implementación: enviar notificación push/in-app
  console.log('Enviando notificación:', mensaje);
  return { notificacion_enviada: true, mensaje };
};

/**
 * Cambia estado de entidad
 */
const cambiarEstado = async (entidadTipo: string, entidadId: string, nuevoEstado: string): Promise<any> => {
  const tableName = entidadTipo === 'cliente' ? 'clientes' : 
                    entidadTipo === 'oportunidad' ? 'oportunidades' :
                    entidadTipo === 'proyecto' ? 'proyectos' : 'tareas';

  await supabase.from(tableName).update({ estado: nuevoEstado }).eq('id', entidadId);
  return { estado_cambiado: true, nuevoEstado };
};

/**
 * Crea tarea desde workflow
 */
const crearTareaDesdeWorkflow = async (
  entidadTipo: string,
  entidadId: string,
  parametros?: any
): Promise<any> => {
  const tarea = {
    titulo: parametros?.titulo || 'Tarea automática',
    descripcion: `Tarea creada automáticamente por workflow de ${entidadTipo}`,
    prioridad: parametros?.prioridad || 'Media',
    estado: 'Pendiente',
    fecha: new Date(Date.now() + (parametros?.dias_desde || 0) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cliente_id: entidadTipo === 'cliente' ? parseInt(entidadId) : null,
    created_at: new Date().toISOString(),
  };

  await supabase.from('tareas').insert(tarea);
  return { tarea_creada: true };
};

/**
 * Envía WhatsApp desde workflow
 */
const enviarWhatsAppWorkflow = async (entidadId: string, template: string): Promise<any> => {
  // Implementación: enviar mensaje WhatsApp usando template
  console.log(`Enviando WhatsApp template ${template} para ${entidadId}`);
  return { whatsapp_enviado: true, template };
};

/**
 * Verifica y ejecuta reglas de workflow basadas en eventos
 */
export const verificarYejecutarWorkflows = async (
  trigger: WorkflowRule['trigger'],
  entidadTipo: WorkflowExecution['entidad_tipo'],
  entidadId: string,
  datosAdicionales?: any
): Promise<void> => {
  try {
    // Obtener reglas activas para este trigger
    const { data: rules } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('trigger', trigger)
      .eq('activo', true);

    if (!rules || rules.length === 0) return;

    // Verificar condiciones y ejecutar
    for (const rule of rules) {
      const condicionesCumplidas = await verificarCondiciones(rule, entidadTipo, entidadId, datosAdicionales);
      
      if (condicionesCumplidas) {
        await ejecutarWorkflowRule(rule, entidadTipo, entidadId);
      }
    }
  } catch (error) {
    console.error('Error verificando workflows:', error);
  }
};

/**
 * Verifica si se cumplen las condiciones de una regla
 */
const verificarCondiciones = async (
  rule: WorkflowRule,
  entidadTipo: string,
  entidadId: string,
  _datosAdicionales?: any
): Promise<boolean> => {
  const condiciones = rule.condiciones;

  // Verificar lead score
  if (condiciones.lead_score_threshold && entidadTipo === 'cliente') {
    const score = await calculateClientScoreFromDB(parseInt(entidadId));
    if (score < condiciones.lead_score_threshold) return false;
  }

  // Verificar días sin actividad
  if (condiciones.dias_sin_actividad && entidadTipo === 'oportunidad') {
    const { data: oportunidad } = await supabase
      .from('oportunidades')
      .select('updated_at')
      .eq('id', entidadId)
      .single();

    if (!oportunidad) return false;

    const diasSinActividad = Math.floor(
      (Date.now() - new Date(oportunidad.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasSinActividad < condiciones.dias_sin_actividad) return false;
  }

  // Verificar días de vencimiento
  if (condiciones.dias_vencimiento !== undefined && entidadTipo === 'tarea') {
    const { data: tarea } = await supabase
      .from('tareas')
      .select('fecha')
      .eq('id', entidadId)
      .single();

    if (!tarea) return false;

    const diasVencidos = Math.floor(
      (Date.now() - new Date(tarea.fecha).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasVencidos < condiciones.dias_vencimiento) return false;
  }

  return true;
};

/**
 * Obtiene el historial de ejecuciones de workflows
 */
export const getWorkflowExecutions = async (limit: number = 50): Promise<WorkflowExecution[]> => {
  try {
    const { data } = await supabase
      .from('workflow_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('Error obteniendo workflow executions:', error);
    return [];
  }
};
