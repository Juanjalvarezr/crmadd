import { supabase } from './supabase';

export interface EmailSequence {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'bienvenida' | 'nutricion' | 'recuperacion' | 'venta' | 'custom';
  activo: boolean;
  emails: EmailSequenceStep[];
  trigger_config: {
    evento: 'cliente_nuevo' | 'lead_score_alto' | 'oportunidad_creada' | 'manual';
    condiciones?: any;
  };
  created_at: string;
  updated_at: string;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  orden: number;
  asunto: string;
  contenido: string;
  delay_dias: number; // Días después del paso anterior
  delay_horas?: number;
  plantilla_id?: string;
  variables?: Record<string, string>;
  activo: boolean;
}

export interface EmailSequenceExecution {
  id: string;
  sequence_id: string;
  cliente_id: number;
  paso_actual: number;
  estado: 'en_progreso' | 'completada' | 'pausada' | 'cancelada';
  started_at: string;
  completed_at?: string;
  next_send_at?: string;
  emails_enviados: EmailSent[];
}

export interface EmailSent {
  id: string;
  execution_id: string;
  step_id: string;
  cliente_id: number;
  asunto: string;
  contenido: string;
  enviado_at: string;
  abierto_at?: string;
  clickeado_at?: string;
  respondido_at?: string;
  estado: 'enviado' | 'abierto' | 'clickeado' | 'respondido' | 'rebotado';
}

/**
 * Secuencias predefinidas de email
 */
const SECUENCIAS_PREDEFINIDAS: Omit<EmailSequence, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    nombre: 'Secuencia de Bienvenida',
    descripcion: 'Secuencia de 3 emails para nuevos clientes',
    tipo: 'bienvenida',
    activo: true,
    trigger_config: {
      evento: 'cliente_nuevo',
    },
    emails: [
      {
        id: 'welcome-1',
        sequence_id: '',
        orden: 1,
        asunto: '¡Bienvenido a DESEO DIGITAL! 🚀',
        contenido: 'Hola {{nombre}},\n\nGracias por registrarte en DESEO DIGITAL. Estamos emocionados de trabajar contigo para potenciar tu presencia digital.\n\nEn los próximos días te contactaremos para conocer más sobre tus objetivos.\n\nSaludos,\nEl equipo de DESEO DIGITAL',
        delay_dias: 0,
        activo: true,
        variables: { nombre: 'cliente.nombre' },
      },
      {
        id: 'welcome-2',
        sequence_id: '',
        orden: 2,
        asunto: '¿Cómo podemos ayudarte hoy?',
        contenido: 'Hola {{nombre}},\n\nQueremos asegurarnos de entender tus necesidades. ¿Cuál es tu principal objetivo digital actual?\n\n- Aumentar ventas\n- Mejorar visibilidad\n- Generar leads\n- Otro\n\nRespóndenos para personalizar nuestra estrategia.\n\nSaludos,\nEquipo DESEO DIGITAL',
        delay_dias: 2,
        activo: true,
        variables: { nombre: 'cliente.nombre' },
      },
      {
        id: 'welcome-3',
        sequence_id: '',
        orden: 3,
        asunto: 'Tu estrategia personalizada está lista 🎯',
        contenido: 'Hola {{nombre}},\n\nBasado en tu perfil, hemos preparado algunas recomendaciones iniciales para tu estrategia digital.\n\n[Enlace a propuesta personalizada]\n\n¿Te gustaría agendar una llamada para discutir los detalles?\n\nSaludos,\nEquipo DESEO DIGITAL',
        delay_dias: 5,
        activo: true,
        variables: { nombre: 'cliente.nombre' },
      },
    ],
  },
  {
    nombre: 'Nutrición de Leads',
    descripcion: 'Secuencia para leads con score medio-alto',
    tipo: 'nutricion',
    activo: true,
    trigger_config: {
      evento: 'lead_score_alto',
      condiciones: { score_minimo: 50 },
    },
    emails: [
      {
        id: 'nurture-1',
        sequence_id: '',
        orden: 1,
        asunto: 'Contenido exclusivo para ti 📚',
        contenido: 'Hola {{nombre}},\n\nNotamos que has mostrado interés en nuestros servicios. Queremos compartirte recursos exclusivos que te ayudarán a alcanzar tus objetivos.\n\n[Enlace a recursos]\n\nSaludos,\nEquipo DESEO DIGITAL',
        delay_dias: 0,
        activo: true,
        variables: { nombre: 'cliente.nombre' },
      },
      {
        id: 'nurture-2',
        sequence_id: '',
        orden: 2,
        asunto: 'Casos de éxito que te inspirarán 💡',
        contenido: 'Hola {{nombre}},\n\nQueremos compartirte cómo hemos ayudado a empresas similares a la tuya a alcanzar sus objetivos.\n\n[Enlace a casos de éxito]\n\n¿Te gustaría saber más?\n\nSaludos,\nEquipo DESEO DIGITAL',
        delay_dias: 4,
        activo: true,
        variables: { nombre: 'cliente.nombre' },
      },
    ],
  },
  {
    nombre: 'Recuperación de Leads Fríos',
    descripcion: 'Secuencia para reactivar leads inactivos',
    tipo: 'recuperacion',
    activo: true,
    trigger_config: {
      evento: 'manual',
    },
    emails: [
      {
        id: 'recover-1',
        sequence_id: '',
        orden: 1,
        asunto: '¿Aún estás interesado? 🤔',
        contenido: 'Hola {{nombre}},\n\nHace tiempo que no nos tenemos noticias. ¿Aún estás interesado en mejorar tu presencia digital?\n\nEstamos aquí para ayudarte cuando estés listo.\n\nSaludos,\nEquipo DESEO DIGITAL',
        delay_dias: 0,
        activo: true,
        variables: { nombre: 'cliente.nombre' },
      },
      {
        id: 'recover-2',
        sequence_id: '',
        orden: 2,
        asunto: 'Oferta especial para ti 🎁',
        contenido: 'Hola {{nombre}},\n\nQueremos darte una segunda oportunidad. Tenemos una oferta especial exclusiva para ti.\n\n[Detalles de oferta]\n\nEsta oferta expira en 7 días.\n\nSaludos,\nEquipo DESEO DIGITAL',
        delay_dias: 3,
        activo: true,
        variables: { nombre: 'cliente.nombre' },
      },
    ],
  },
];

/**
 * Inicializa las secuencias de email en la base de datos
 */
export const inicializarEmailSequences = async (): Promise<void> => {
  try {
    const { data: existingSequences } = await supabase.from('email_sequences').select('id');
    
    if (!existingSequences || existingSequences.length === 0) {
      for (const sequence of SECUENCIAS_PREDEFINIDAS) {
        const { data: createdSequence } = await supabase
          .from('email_sequences')
          .insert({
            ...sequence,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        // Insertar pasos de la secuencia
        if (createdSequence) {
          for (const step of sequence.emails) {
            await supabase.from('email_sequence_steps').insert({
              ...step,
              sequence_id: createdSequence.id,
            });
          }
        }
      }
      console.log('Secuencias de email inicializadas');
    }
  } catch (error) {
    console.error('Error inicializando email sequences:', error);
  }
};

/**
 * Inicia una secuencia de email para un cliente
 */
export const iniciarSecuenciaParaCliente = async (
  sequenceId: string,
  clienteId: number
): Promise<EmailSequenceExecution> => {
  try {
    // Obtener secuencia
    const { data: sequence } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('id', sequenceId)
      .single();

    if (!sequence) throw new Error('Secuencia no encontrada');

    // Crear ejecución
    const execution: Omit<EmailSequenceExecution, 'id'> = {
      sequence_id: sequenceId,
      cliente_id: clienteId,
      paso_actual: 1,
      estado: 'en_progreso',
      started_at: new Date().toISOString(),
      next_send_at: new Date().toISOString(),
      emails_enviados: [],
    };

    const { data: createdExecution } = await supabase
      .from('email_sequence_executions')
      .insert(execution)
      .select()
      .single();

    // Programar primer email
    await programarProximoEmail(createdExecution.id);

    return createdExecution;
  } catch (error) {
    console.error('Error iniciando secuencia:', error);
    throw error;
  }
};

/**
 * Programa el próximo email de una secuencia
 */
const programarProximoEmail = async (executionId: string): Promise<void> => {
  try {
    const { data: execution } = await supabase
      .from('email_sequence_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (!execution || execution.estado !== 'en_progreso') return;

    // Obtener pasos de la secuencia
    const { data: steps } = await supabase
      .from('email_sequence_steps')
      .select('*')
      .eq('sequence_id', execution.sequence_id)
      .eq('activo', true)
      .order('orden');

    if (!steps || steps.length === 0) return;

    // Encontrar el paso actual
    const currentStep = steps.find(s => s.orden === execution.paso_actual);
    if (!currentStep) {
      // No hay más pasos, completar secuencia
      await supabase
        .from('email_sequence_executions')
        .update({ estado: 'completada', completed_at: new Date().toISOString() })
        .eq('id', executionId);
      return;
    }

    // Calcular fecha de envío
    const sendDate = new Date();
    sendDate.setDate(sendDate.getDate() + currentStep.delay_dias);
    if (currentStep.delay_horas) {
      sendDate.setHours(sendDate.getHours() + currentStep.delay_horas);
    }

    // Actualizar next_send_at
    await supabase
      .from('email_sequence_executions')
      .update({ next_send_at: sendDate.toISOString() })
      .eq('id', executionId);

  } catch (error) {
    console.error('Error programando próximo email:', error);
  }
};

/**
 * Procesa secuencias pendientes de envío (debe ejecutarse periódicamente)
 */
export const procesarSecuenciasPendientes = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();

    // Obtener ejecuciones pendientes
    const { data: pendingExecutions } = await supabase
      .from('email_sequence_executions')
      .select('*')
      .eq('estado', 'en_progreso')
      .lte('next_send_at', now);

    if (!pendingExecutions || pendingExecutions.length === 0) return;

    for (const execution of pendingExecutions) {
      await enviarPasoSecuencia(execution);
    }
  } catch (error) {
    console.error('Error procesando secuencias pendientes:', error);
  }
};

/**
 * Envía el paso actual de una secuencia
 */
const enviarPasoSecuencia = async (execution: EmailSequenceExecution): Promise<void> => {
  try {
    // Obtener paso actual
    const { data: step } = await supabase
      .from('email_sequence_steps')
      .select('*')
      .eq('sequence_id', execution.sequence_id)
      .eq('orden', execution.paso_actual)
      .single();

    if (!step) return;

    // Obtener datos del cliente para personalizar
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', execution.cliente_id)
      .single();

    if (!cliente) return;

    // Personalizar contenido
    let asuntoPersonalizado = step.asunto;
    let contenidoPersonalizado = step.contenido;

    if (step.variables) {
      Object.entries(step.variables).forEach(([key, value]) => {
        const replacement = value === 'cliente.nombre' ? cliente.nombre : '';
        asuntoPersonalizado = asuntoPersonalizado.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
        contenidoPersonalizado = contenidoPersonalizado.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
      });
    }

    // Aquí iría la integración real con el servicio de email (Resend, SendGrid, etc.)
    console.log(`Enviando email a ${cliente.email}:`, asuntoPersonalizado);
    
    // Registrar email enviado
    const emailSent: Omit<EmailSent, 'id'> = {
      execution_id: execution.id,
      step_id: step.id,
      cliente_id: execution.cliente_id,
      asunto: asuntoPersonalizado,
      contenido: contenidoPersonalizado,
      enviado_at: new Date().toISOString(),
      estado: 'enviado',
    };

    await supabase.from('email_sent').insert(emailSent);

    // Avanzar al siguiente paso
    await supabase
      .from('email_sequence_executions')
      .update({ paso_actual: execution.paso_actual + 1 })
      .eq('id', execution.id);

    // Programar siguiente email
    await programarProximoEmail(execution.id);

  } catch (error) {
    console.error('Error enviando paso de secuencia:', error);
  }
};

/**
 * Registra apertura de email (tracking)
 */
export const registrarAperturaEmail = async (emailId: string): Promise<void> => {
  try {
    await supabase
      .from('email_sent')
      .update({ 
        abierto_at: new Date().toISOString(),
        estado: 'abierto'
      })
      .eq('id', emailId);
  } catch (error) {
    console.error('Error registrando apertura:', error);
  }
};

/**
 * Registra clic en email (tracking)
 */
export const registrarClicEmail = async (emailId: string): Promise<void> => {
  try {
    await supabase
      .from('email_sent')
      .update({ 
        clickeado_at: new Date().toISOString(),
        estado: 'clickeado'
      })
      .eq('id', emailId);
  } catch (error) {
    console.error('Error registrando clic:', error);
  }
};

/**
 * Obtiene métricas de una secuencia
 */
export const getSecuenciaMetrics = async (sequenceId: string): Promise<any> => {
  try {
    const { data: executions } = await supabase
      .from('email_sequence_executions')
      .select('*')
      .eq('sequence_id', sequenceId);

    if (!executions) return null;

    const total = executions.length;
    const completadas = executions.filter(e => e.estado === 'completada').length;
    const enProgreso = executions.filter(e => e.estado === 'en_progreso').length;

    // Obtener emails enviados
    const executionIds = executions.map(e => e.id);
    const { data: emails } = await supabase
      .from('email_sent')
      .select('*')
      .in('execution_id', executionIds);

    const enviados = emails?.length || 0;
    const abiertos = emails?.filter(e => e.abierto_at).length || 0;
    const clickeados = emails?.filter(e => e.clickeado_at).length || 0;

    return {
      total,
      completadas,
      enProgreso,
      enviados,
      abiertos,
      clickeados,
      tasaApertura: enviados > 0 ? (abiertos / enviados) * 100 : 0,
      tasaClics: enviados > 0 ? (clickeados / enviados) * 100 : 0,
    };
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    return null;
  }
};
