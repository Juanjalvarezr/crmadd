import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  supabase, 
  serviciosService, 
  conocimientoService, 
  promptsAIService, 
  logsService, 
  emailService, 
  interaccionesService,
  tareasService,
  proyectosService,
  clientesService,
  oportunidadesService
} from "./database";
import type { Proyecto, Tarea } from "../types/crm";

// Inicializamos el SDK de Gemini. 
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const getLocalAIModel = (modelName = "gemini-1.5-flash") => {
  if (!apiKey || apiKey === "tu-api-key-aqui") {
    throw new Error("Falta la API Key de Gemini. Debes configurar VITE_GEMINI_API_KEY en tu archivo .env");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

const getLocalEmbeddingModel = () => {
  if (!apiKey || apiKey === "tu-api-key-aqui") {
    throw new Error("Falta la API Key de Gemini. Debes configurar VITE_GEMINI_API_KEY en tu archivo .env");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "embedding-001" });
};

/**
 * Orquestador Centralizado de Generación: Llama a Supabase Edge Function proxy si está activa,
 * o hace fallback seguro al SDK local de Gemini.
 */
const executeGenerateContent = async (prompt: string, modelName = "gemini-1.5-flash"): Promise<string> => {
  const useEdgeFunctions = import.meta.env.VITE_USE_EDGE_FUNCTIONS === "true";
  
  if (useEdgeFunctions) {
    try {
      const { data, error } = await supabase.functions.invoke("gemini-proxy", {
        body: { action: "generateText", prompt, model: modelName }
      });
      if (error) throw error;
      if (data && data.text) return data.text;
    } catch (err) {
      console.warn("⚠️ Supabase Edge Function falló, usando SDK de Gemini local como respaldo:", err);
    }
  }

  // Fallback Local SDK
  const model = getLocalAIModel(modelName);
  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * Orquestador Centralizado de Embeddings: Llama a Supabase Edge Function proxy si está activa,
 * o hace fallback seguro al SDK local de Gemini.
 */
const executeEmbedContent = async (text: string): Promise<number[]> => {
  const useEdgeFunctions = import.meta.env.VITE_USE_EDGE_FUNCTIONS === "true";
  
  if (useEdgeFunctions) {
    try {
      const { data, error } = await supabase.functions.invoke("gemini-proxy", {
        body: { action: "embedText", text }
      });
      if (error) throw error;
      if (data && data.embedding) return data.embedding;
    } catch (err) {
      console.warn("⚠️ Supabase Edge Function de embeddings falló, usando SDK local:", err);
    }
  }

  // Fallback Local SDK
  const embeddingModel = getLocalEmbeddingModel();
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
};

/**
 * Define la interfaz para los resultados de la auditoría para evitar errores de tipado.
 */
export interface HallazgoAuditoria {
  hallazgo: string;
  solucion: string;
  impacto: string;
  prioridad: 'alta' | 'media' | 'baja';
}

/**
 * Proxy de getAIModel: Intercepta llamadas y las orquesta centralizadamente.
 */
const getAIModel = (modelName = "gemini-1.5-flash") => {
  return {
    async countTokens(text: string) {
      return getLocalAIModel(modelName).countTokens(text);
    },
    async generateContent(prompt: string) {
      const textContent = await executeGenerateContent(prompt, modelName);
      const responseObj = {
        text: () => textContent,
      };
      return {
        response: responseObj
      };
    }
  };
};

/**
 * Proxy de getEmbeddingModel: Intercepta llamadas y las orquesta centralizadamente.
 */
const getEmbeddingModel = () => {
  return {
    async embedContent(text: string) {
      const values = await executeEmbedContent(text);
      return {
        embedding: {
          values
        }
      };
    }
  };
};

/**
 * Helper para reemplazar variables en formato {{variable}} o {{objeto.propiedad}}
 */
const fillTemplate = (template: string, data: Record<string, any>) => {
  return template.replace(/{{([\w\.]+)}}/g, (match, key) => {
    const keys = key.split('.');
    let value: any = data;
    for (const k of keys) {
      value = value?.[k];
    }
    // Si es un objeto, lo convertimos a JSON legible, si no a string
    return value !== undefined ? (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)) : match;
  });
};

/**
 * Sanitizador Global: Limpia y parsea de forma segura las respuestas JSON de la IA.
 */
const parseAIResponse = (text: string): any => {
  try {
    // Intenta encontrar el primer '{' y el último '}' para extraer el JSON puro
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    let jsonContent: string;
    
    if (start === -1 || end === -1) {
      const arrayStart = text.indexOf('[');
      const arrayEnd = text.lastIndexOf(']');
      if (arrayStart === -1 || arrayEnd === -1) {
        console.warn("No se encontró JSON en la respuesta, devolviendo texto plano.");
        return { text };
      }
      jsonContent = text.substring(arrayStart, arrayEnd + 1);
    } else {
      jsonContent = text.substring(start, end + 1);
    }

    const cleanText = jsonContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error crítico parseando respuesta de IA:", error);
    return { text, error: true };
  }
};

/**
 * Punto 10 y 11: Orquestador de Acciones.
 */
export const ejecutarAccionSincrona = async (pregunta: string, respuestaIA: string) => {
  try {
    const model = getLocalAIModel(); // Usamos el modelo directo para análisis de fondo rápido
    const prompt = `
      SISTEMA OPERATIVO DESEO DIGITAL:
      TAREA: Determinar si el usuario dio una ORDEN técnica.
      Si el usuario solo está conversando, responde NINGUNA.
      USER_MESSAGE: "${pregunta}"
      AI_RESPONSE_CONTEXT: "${respuestaIA}"

      IMPORTANTE: No inventes IDs. Si necesitas un ID de proyecto o cliente, búscalo en el CONTEXTO CRM proporcionado.

      REGLAS DE ORO DE LA AGENCIA:
      1. Finanzas: El anticipo del 50% es obligatorio para pasar a fase "Operación".
      2. Estrategia: Debe existir un "Brief de Identidad" procesado antes de grabar Reels.
      3. Operaciones: Se deben documentar todos los nuevos procesos en el Manual (SOP).

      CATÁLOGO DE ACCIONES DISPONIBLES:
      - GUARDAR_PROCESO: { titulo: string, contenido: string }
      - ACTUALIZAR_CLIENTE: { id: number, cambios: object }
      - CREAR_TAREA: { titulo: string, descripcion: string, prioridad: string, responsable_id?: number, cliente_id?: number }
      - AGENDAR_CITA: { cliente_id: number, titulo: string, fecha: string, link?: string }
      - ENVIAR_CORREO: { email: string, asunto: string, cuerpo: string, cliente_id: number }
      - CREAR_FACTURA: { cliente_id: number, proyecto_id?: string, numero: string, tipo: string, subtotal: number, iva?: number, total: number, moneda?: string, estado?: string, notas?: string }
      - CREAR_CONTRATO: { cliente_id: number, proyecto_id?: string, tipo: string, titulo: string, contenido: string, numero?: string, estado?: string, valor?: number }
      - GENERAR_PDF_FACTURA: { factura_id: string }
      - GENERAR_PDF_CONTRATO: { contrato_id: string }
      - ENVIAR_WHATSAPP: { telefono: string, mensaje: string }
      - ENVIAR_CORREO_CON_PDF: { email: string, asunto: string, cuerpo: string, pdf_url?: string }
      - ACTUALIZAR_PROYECTO: { id: string, estado?: string, progreso?: number, fase?: string }
      - ANALIZAR_ESTRATEGIA: { proyecto_id: string } -> Para cuando Juan pide consejos tácticos.
      - BLOQUEO_OPERATIVO: { motivo: string } -> Si se viola una Regla de Oro.

      REGLA DE RETROALIMENTACIÓN:
      Si Juan da una instrucción imprecisa, responde con NINGUNA pero sugiere la acción en el campo "confirmacion".

      Responde ÚNICAMENTE en JSON con este formato:
      {
        "accion": "GUARDAR_PROCESO" | "ACTUALIZAR_CLIENTE" | "CREAR_TAREA" | "AGENDAR_CITA" | "ENVIAR_CORREO" | "ACTUALIZAR_PROYECTO" | "BLOQUEO_OPERATIVO" | "NINGUNA",
        "datos": { ... los datos necesarios para la acción ... },
        "confirmacion": "Un mensaje corto de lo que vas a ejecutar o por qué bloqueas la acción"
      }

      Si la acción es "ACTUALIZAR_PROYECTO" y Juan dice "completar" o "terminado", pon:
      { "estado": "completado", "progreso": 100 }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const infoAccion = parseAIResponse(responseText);
    if (infoAccion.error || !infoAccion.accion || infoAccion.accion === "NINGUNA") {
      console.log("🤖 IA no detectó acciones técnicas para ejecutar.");
      return null;
    }

    const datos = infoAccion.datos || {};

    if (infoAccion.accion === "GUARDAR_PROCESO" && datos.contenido) {
      const embedding = await executeEmbedContent(infoAccion.datos.contenido);
      await conocimientoService.create({
        titulo: infoAccion.datos.titulo || "Nuevo Proceso Operativo",
        contenido: String(infoAccion.datos.contenido),
        categoria: "operaciones",
        embedding
      });
      return infoAccion.confirmacion;
    }
    
    if (infoAccion.accion === "CREAR_TAREA") {
      // Sanitización de prioridad para cumplir con las reglas de negocio y restricciones de la DB
      let prioridad: "Baja" | "Media" | "Alta" = "Media";
      const p = String(infoAccion.datos.prioridad || "").toLowerCase();
      if (p.includes("alta")) prioridad = "Alta";
      else if (p.includes("baja")) prioridad = "Baja";

      await tareasService.create({ // Corregido: estaba como string en algunos lugares
        titulo: String(infoAccion.datos.titulo || "Nueva Tarea IA"),
        descripcion: String(infoAccion.datos.descripcion || ""),
        prioridad,
        estado: "Pendiente",
        tipo: "Tarea",
        cliente_id: datos.cliente_id && !isNaN(Number(datos.cliente_id)) ? Number(datos.cliente_id) : null,
        fecha: new Date().toISOString().split('T')[0]
      });
      return infoAccion.confirmacion;
    }

    if (infoAccion.accion === "ENVIAR_CORREO") {
      const { email, asunto, cuerpo, cliente_id } = infoAccion.datos;
      // Ejecutar envío real
      await emailService.sendRealEmail([email], asunto, cuerpo);
      // Registrar interacción
      await interaccionesService.create({
        cliente_id,
        tipo: 'Email',
        asunto,
        contenido: cuerpo,
        usuario: 'Asistente IA'
      });
      return infoAccion.confirmacion;
    }

    if (infoAccion.accion === "ACTUALIZAR_CLIENTE") {
      const { id, cambios } = infoAccion.datos;
      if (id && !isNaN(Number(id))) {
        await clientesService.update(Number(id), cambios);
        return infoAccion.confirmacion;
      }
    }

    if (infoAccion.accion === "BLOQUEO_OPERATIVO") {
      console.warn("🛑 Bloqueo por Regla de Oro:", infoAccion.datos.motivo);
      return `🛑 Acción Bloqueada: ${infoAccion.datos.motivo}`;
    }

    if (infoAccion.accion === "ACTUALIZAR_PROYECTO") {
      const { id, ...updates } = infoAccion.datos;
      if (id && (typeof id === "string" || typeof id === "number")) {
        const idLimpio = String(id).trim();
        if (!confirm(`¿Actualizar el proyecto ${idLimpio}?`)) return "Acción cancelada por el usuario.";
        return await proyectosService.update(idLimpio, { ...updates, actualizadoEn: new Date().toISOString() } as any)
          .then(() => infoAccion.confirmacion)
          .catch(async (error: any) => {
            await logsService.create?.({
              accion: "Error Actualización IA",
              modulo: "Proyectos",
              detalle: `Error al intentar actualizar ID ${idLimpio}: ${error.message}`,
              usuario: "Sistema IA"
            }).catch(() => {});
            console.error("Error en acción IA:", error);
            return `⚠️ Error técnico al actualizar: ${error.message || "Verifica los datos"}`;
          });
      }
    }

    if (infoAccion.accion === "CREAR_TAREA") {
      return await safeCreate(() => tareasService.create({
        titulo: String(infoAccion.datos.titulo || "Nueva Tarea IA"),
        descripcion: String(infoAccion.datos.descripcion || ""),
        prioridad: infoAccion.datos.prioridad || "Media",
        estado: "Pendiente",
        tipo: "Tarea",
        cliente_id: infoAccion.datos.cliente_id && !isNaN(Number(infoAccion.datos.cliente_id)) ? Number(infoAccion.datos.cliente_id) : null,
        proyecto_id: infoAccion.datos.proyecto_id || null,
        fecha: new Date().toISOString().split("T")[0]
      }), infoAccion.confirmacion, "tarea");
    }

    if (infoAccion.accion === "ENVIAR_CORREO") {
      const { email, asunto, cuerpo } = infoAccion.datos || {};
      if (!email || !asunto || !cuerpo) return "Faltan datos para enviar el correo.";
      await emailService.sendRealEmail([email], asunto, cuerpo);
      return infoAccion.confirmacion;
    }

    if (infoAccion.accion === "CREAR_FACTURA") {
      const datos = infoAccion.datos || {};
      return await safeCreate(() => facturasService.create?.({
        cliente_id: Number(datos.cliente_id),
        proyecto_id: datos.proyecto_id || null,
        numero: datos.numero || `FAC-${Date.now()}`,
        tipo: datos.tipo || "electronica",
        subtotal: Number(datos.subtotal || 0),
        iva: Number(datos.iva || 0),
        total: Number(datos.total || 0),
        moneda: datos.moneda || "COP",
        estado: datos.estado || "pendiente",
        notas: datos.notas || ""
      }), infoAccion.confirmacion, "factura");
    }

    if (infoAccion.accion === "GENERAR_PDF_FACTURA" && infoAccion.datos?.factura_id) {
      return `📄 Se generaría el PDF de la factura ${infoAccion.datos.factura_id}. Requiere endpoint de PDF.`;
    }

    if (infoAccion.accion === "CREAR_CONTRATO") {
      const datos = infoAccion.datos || {};
      return await safeCreate(() => contratosService.create?.({
        cliente_id: Number(datos.cliente_id),
        proyecto_id: datos.proyecto_id || null,
        tipo: datos.tipo || "servicios",
        titulo: datos.titulo || "Contrato",
        contenido: datos.contenido || "",
        numero: datos.numero || `CTR-${Date.now()}`,
        estado: datos.estado || "borrador",
        valor: Number(datos.valor || 0)
      }), infoAccion.confirmacion, "contrato");
    }

    if (infoAccion.accion === "GENERAR_PDF_CONTRATO" && infoAccion.datos?.contrato_id) {
      return `📄 Se generaría el PDF del contrato ${infoAccion.datos.contrato_id}. Requiere endpoint de PDF.`;
    }

    if (infoAccion.accion === "ENVIAR_WHATSAPP") {
      const { telefono, mensaje } = infoAccion.datos || {};
      if (!telefono || !mensaje) return "Faltan datos para enviar WhatsApp.";
      return `📱 Se enviaría WhatsApp a ${telefono}: "${mensaje}" (requiere integración).`;
    }

    if (infoAccion.accion === "ENVIAR_CORREO_CON_PDF") {
      const { email, asunto, cuerpo, pdf_url } = infoAccion.datos || {};
      if (!email || !asunto) return "Faltan datos para enviar el correo.";
      const cuerpoFinal = `${cuerpo || ""}

Documento: ${pdf_url || "(sin PDF)"}`;
      await emailService.sendRealEmail([email], asunto, cuerpoFinal);
      return infoAccion.confirmacion;
    }

    return infoAccion.confirmacion;
  } catch (e) {
    console.error("Falla en Orquestador:", e);
    throw new Error("No se pudo ejecutar la acción automática.");
  }
};

async function safeCreate(fn: () => Promise<any>, confirmacion: string, tipo: string) {
  try {
    await fn();
    return confirmacion;
  } catch (error: any) {
    console.error(`Error creando ${tipo}:`, error);
    return `⚠️ Error técnico al crear ${tipo}: ${error.message || "Verifica los datos"}`;
  }
}

export interface AIPropuestaParams {
  clienteNombre: string;
  clienteEmpresa: string;
  servicios: string[];
  notasAdicionales: string;
  dolorNecesidad: string;
  presenciaRedes: string;
  objetivos: string;
  presupuestoEstimado?: number;
}

export const aiService = {
  /**
   * Genera una propuesta comercial y un cronograma base a partir de los datos ingresados.
   */
  async generarPropuesta(params: AIPropuestaParams, onStream?: (text: string) => void): Promise<string> {
    try {
      const model = getLocalAIModel(); // Usamos el local para streaming directo
      
      const dbPrompt = await promptsAIService.getBySlug('director_estrategico_propuesta');
      let prompt = "";

      if (dbPrompt) {
        prompt = fillTemplate(dbPrompt.user_prompt_template, {
          ...params,
          servicios: params.servicios.join(", ")
        });
      } else {
        // Fallback en caso de que no exista en la DB
        prompt = `
        Eres el Director Estratégico Senior de DESEO DIGITAL, una agencia de marketing de élite.
        Tu objetivo es redactar una Propuesta Comercial persuasiva, profesional y accionable para un cliente.

        DATOS DEL CLIENTE:
        - Nombre: ${params.clienteNombre}
        - Empresa: ${params.clienteEmpresa}
        - Servicios de interés: ${params.servicios.join(", ")}
        - Dolor / necesidad principal: ${params.dolorNecesidad || "No especificado"}
        - Presencia digital actual: ${params.presenciaRedes || "No especificada"}
        - Objetivos principales: ${params.objetivos || "No especificados"}
        - Presupuesto estimado: ${params.presupuestoEstimado ? `COP ${params.presupuestoEstimado}` : "No especificado"}
        - Notas adicionales/Contexto: ${params.notasAdicionales || "Ninguna."}

        INSTRUCCIONES:
        Genera un documento en formato Markdown con la siguiente estructura:
        1. **Resumen Ejecutivo:** Un saludo profesional y un análisis breve del dolor/necesidad y cómo los servicios elegidos potenciarán a ${params.clienteEmpresa}.
        2. **Estrategia Propuesta:** Describe acciones específicas para pasar de la presencia digital actual a los objetivos deseados, usando los servicios de (${params.servicios.join(", ")}).
        3. **Cronograma Base (Sugerido):** Un plan de acción dividido en 4 semanas (Mes 1) con los primeros pasos y responsables sugeridos.
        4. **Términos de Inversión:** Menciona claramente que para iniciar el proceso se requiere un **anticipo del 50%**, y el saldo restante se cancela al finalizar la ejecución del paquete mensual o entrega del proyecto.
        5. **Llamado a la Acción:** Un cierre persuasivo para que el cliente apruebe la cotización.

        TONO: Seguro, moderno, orientado a resultados y premium. Usa viñetas y negritas para facilitar la lectura. No inventes precios.
      `;}

      if (onStream) {
        const result = await model.generateContentStream(prompt);
        let fullText = "";
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          onStream(fullText);
        }
        return fullText;
      } else {
        const result = await model.generateContent(prompt);
        return result.response.text();
      }

    } catch (error: any) {
      console.error("Error al generar propuesta con IA:", error);
      throw error; // Lanzamos el error para que la UI lo maneje (Ej. mostrando un Snackbar de error)
    }
  },

  /**
   * Cuenta los tokens reales de un texto usando el modelo de Gemini.
   * Reemplaza la estimación manual para mayor precisión.
   */
  async contarTokens(texto: string): Promise<number> {
    try {
      const model = getLocalAIModel();
      const result = await model.countTokens(texto);
      return result.totalTokens;
    } catch (error) {
      console.warn("Error al contar tokens, usando estimación fallback:", error);
      return Math.ceil(texto.length / 4);
    }
  },

  /**
   * Genera un embedding para un texto usando el modelo de Gemini.
   * Punto 6: Soporte para búsqueda semántica en la base de conocimiento.
   */
  async generarEmbedding(texto: string): Promise<number[]> {
    try {
      const embeddingModel = getEmbeddingModel();
      const result = await embeddingModel.embedContent(texto);
      return result.embedding.values;
    } catch (error) {
      console.error("Error al generar embedding:", error);
      throw error;
    }
  },

  /**
   * Genera un plan de contenido (reels, stories, pauta) basado en los detalles del proyecto.
   */
  async generarPlanContenido(proyecto: Proyecto): Promise<{reels: string[], stories: string[], pauta: string[]}> {
    try {
      const model = getAIModel();
      const dbPrompt = await promptsAIService.getBySlug('content_lead_plan_contenido');

      let prompt = "";
      if (dbPrompt) {
        prompt = fillTemplate(dbPrompt.user_prompt_template, { proyecto });
      } else {
        prompt = `
        Eres el Content Lead de DESEO DIGITAL. Tu tarea es generar un plan de contenido estratégico para un proyecto de marketing.

        DETALLES DEL PROYECTO:
        - Nombre: ${proyecto.nombre}
        - Descripción: ${proyecto.descripcion}
        - Fase Administrativa: ${proyecto.faseAdministrativa}
        - Servicios contratados: ${proyecto.servicios?.join(", ") || "Por definir"}
        - Cliente: ${proyecto.clienteNombre}

        REQUERIMIENTOS DEL PLAN:
        1. Reels (4 ideas): Incluye Gancho, Contenido y CTA. Indica qué debe grabar el cliente y qué edita Jessica López.
        2. Stories (5 ideas): Ideas de interacción (encuestas, cajas de preguntas).
        3. Pauta (2 ideas): Enfoque en anuncios pagados con fuerte llamado a la acción.

        INSTRUCCIONES DE RESPUESTA:
        Responde ÚNICAMENTE con un objeto JSON válido. No incluyas explicaciones adicionales ni bloques de código Markdown.
        Menciona a "Jessica López" como responsable de edición en las ideas de Reels.

        ESTRUCTURA:
        {
          "reels": ["Idea Reel 1", "Idea Reel 2", "Idea Reel 3", "Idea Reel 4"],
          "stories": ["Story 1", "Story 2", "Story 3", "Story 4", "Story 5"],
          "pauta": ["Anuncio Pauta 1", "Anuncio Pauta 2"]
        }
      `;}

      const result = await model.generateContent(prompt);
      return parseAIResponse(result.response.text());
    } catch (error) {
      console.error("Error en generarPlanContenido:", error);
      throw error;
    }
  },

  /**
   * Función general para que el asistente responda a cualquier pregunta de marketing o del CRM.
   */
  async chatAsistente(pregunta: string, contextoCRM: string = "", roleSlug: string = "business_architect_cfo_chat"): Promise<string> {
    try {
      const model = getAIModel();
      const embeddingModel = getEmbeddingModel();

      // Punto 6: Búsqueda Semántica
      // 1. Generamos el embedding de la pregunta del usuario
      const embeddingResult = await embeddingModel.embedContent(pregunta);
      const embedding = embeddingResult.embedding.values;

      // 2. Buscamos en la base de datos por similitud de significado
      const [reglasRes, conocimientoSemantico] = await Promise.all([
        supabase.from('reglas_negocio_ai').select('instruccion'),
        conocimientoService.buscarSemantico(embedding)
      ]);
      
      const contextoReglas = reglasRes.data?.map(r => `- ${r.instruccion}`).join('\n') || "";
      const contextoConocimiento = conocimientoSemantico
        .map((c: any) => `### ${c.titulo} (${c.categoria}):\n${c.contenido}`)
        .join('\n\n') || "No hay manuales específicos para esta consulta.";

      const dbPrompt = await promptsAIService.getBySlug(roleSlug);

      let prompt = "";
      if (dbPrompt) {
        prompt = fillTemplate(dbPrompt.user_prompt_template, {
          contextoReglas,
          contextoConocimiento,
          contextoCRM,
          pregunta
        });
      } else {
        prompt = `
        Eres el Business Architect y CFO de DESEO DIGITAL. Ayuda a Juan (CEO) con el Sistema Operativo de Negocio.
        
        CONTEXTO OPERATIVO:
        - Pack Elite: $2M COP. 4 Reels/mes, 5 Historias/día.
        - Gestión de Pagos: Nequi, Daviplata, Transferencia.
        - Flujo: Propuesta -> Contrato -> Onboarding -> Operación -> Capacitación -> Renovación.
        
        TU MISIÓN PROACTIVA:
        1. **PM Administrativo**: Revisa si hay proyectos estancados en fase "Onboarding" o "Contrato".
        2. **Estratega de Contenido**: Sugiere ideas creativas para Reels y Stories basadas en el nicho del cliente.
        3. **Analista de Dolores**: Si Juan captura un "Dolor" (ej. bajas ventas), tu respuesta debe enfocarse 100% en cómo el Pack Elite soluciona ese dolor específico.
        3. **Alertas de Renovación**: Avisa 30 días antes de que un proyecto pase a fase de "Renovación".
        4. **Gestor de Cobros**: Identifica proyectos con pago "Pendiente" o "Vencido" y ofrece redactar un mensaje de recordatorio amable.
        
        Tienes acceso a la información en tiempo real del CRM.
        
        TUS REGLAS DE ORO (MEMORIA DE NEGOCIO):
        ${contextoReglas}

        MANUALES Y PLANTILLAS DE DESEO DIGITAL (CONOCIMIENTO):
        ${contextoConocimiento}

        REGLAS DE CUMPLIMIENTO LEGAL Y ÉTICA GENERALES DE DESEO DIGITAL:
        - Para el nicho "Salud": Priorizar autoridad y confianza profesional. Evitar promesas agresivas de resultados médicos. Las estrategias de Social Media y Ads deben cumplir con las directrices de ética médica y publicidad de salud (ej. Supersalud en Colombia).
        - Para el nicho "E-commerce": Enfocarse en la seguridad transaccional, transparencia en políticas de devoluciones y cumplimiento de la Ley del Consumidor y Habeas Data (protección de datos). Los servicios de diseño web deben incluir pasarelas seguras.
        - Para otros nichos: Mantener un enfoque orientado a resultados comerciales y crecimiento digital premium.

        DATOS ACTUALES DEL CRM:
        ${contextoCRM || "Sin datos de contexto específicos cargados."}
        
        Tu misión es asesorar al equipo sobre cómo mejorar estos proyectos o gestionar nuevos leads. 
        Pregunta: "${pregunta}"
        
        Responde con un tono profesional, innovador y enfocado en el ROI.
      `;}

      const result = await model.generateContent(prompt);
      const textoRespuesta = result.response.text();

      // Punto 10: Intentar ejecutar acciones de fondo
      void ejecutarAccionSincrona(pregunta, textoRespuesta);

      return textoRespuesta;
    } catch (error: any) {
      console.error("Error en chat de asistente:", error);
      throw error;
    }
  },

  /**
   * Consulta el estado real de los proyectos en Supabase y genera una respuesta contextualizada.
   */
  async chatConDatosReales(pregunta: string, roleSlug: string = "business_architect_cfo_chat"): Promise<string> {
    try {
      const [proyectos, clientes] = await Promise.all([
        proyectosService.getAll(),
        clientesService.getAll()
      ]);

      const contextoCRM = `
        DATOS ACTUALES DEL CRM PARA TU ANÁLISIS:
        
        PROYECTOS:
        ${proyectos.map(p => `- ${p.nombre} (ID: ${p.id}): Estado ${p.estado}, Progreso ${p.progreso}%, Fase: ${p.faseAdministrativa}`).join('\n')}
        
        CLIENTES:
        ${clientes.map(c => `- ${c.nombre} (ID: ${c.id}): Empresa ${c.empresa}, Nicho: ${c.nicho}, Estado: ${c.estado}`).join('\n')}
      `;
      
      return this.chatAsistente(pregunta, contextoCRM, roleSlug);
    } catch (error) {
      console.error("Error al obtener datos reales para el chatbot:", error);
      return "Lo siento, en este momento no puedo acceder a la base de datos de proyectos para darte información exacta.";
    }
  },

  /**
   * Analiza si un proyecto específico está en riesgo basándose en su fecha de fin y tareas pendientes.
   */
  async analizarRiesgoProyecto(proyectoId: string): Promise<string> {
    try {
      const proyectos = await proyectosService.getAll();
      const proyecto = proyectos.find(p => String(p.id) === String(proyectoId));
      
      if (!proyecto) {
        return "No se encontró el proyecto solicitado para realizar el análisis de riesgo.";
      }

      const model = getAIModel();
      const hoy = new Date();
      const fechaFin = new Date(proyecto.fechaFin);
      const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      const tareasPendientes = (proyecto.tareas || [])
        .filter((t: any) => !t.completada)
        .map((t: any) => t.nombre);

      const prompt = `
        Eres el Director de Operaciones de DESEO DIGITAL. Analiza el riesgo de cumplimiento del siguiente proyecto:

        PROYECTO: ${proyecto.nombre}
        PROGRESO: ${proyecto.progreso}%
        FECHA ENTREGA: ${proyecto.fechaFin} (${diasRestantes > 0 ? diasRestantes : 'Plazo vencido'} días restantes)
        TAREAS PENDIENTES: ${tareasPendientes.length > 0 ? tareasPendientes.join(", ") : "Sin tareas pendientes registradas."}
        DESCRIPCIÓN: ${proyecto.descripcion}

        POR FAVOR PROPORCIONA:
        1. **Nivel de Riesgo:** (Bajo, Medio, Alto o Crítico) con una breve justificación técnica.
        2. **Análisis de Tiempos:** ¿Es realista terminar considerando el progreso actual y los días restantes?
        3. **Plan de Mitigación:** 3 acciones concretas para mitigar riesgos o acelerar la entrega.

        Responde de forma ejecutiva y profesional en formato Markdown.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error en analizarRiesgoProyecto:", error);
      return "Hubo un error al intentar analizar el riesgo del proyecto con la IA.";
    }
  },

  /**
   * Genera un borrador de mensaje para WhatsApp adaptado al perfil del cliente.
   */
  async redactarMensajeWhatsApp(clienteNombre: string, contexto: string): Promise<string> {
    try {
      const model = getAIModel();
      const prompt = `
        Eres el Director de Cuentas de DESEO DIGITAL. 
        Redacta un mensaje de WhatsApp para el cliente ${clienteNombre}.
        Contexto del mensaje: ${contexto}
        
        REGLAS:
        - Usa un tono profesional pero cercano (estilo WhatsApp).
        - Incluye emojis de forma elegante.
        - Sé breve y ve al grano.
        - Termina con una pregunta para fomentar la respuesta.
      `;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return `Hola ${clienteNombre}, ¿cómo estás? Quería ponerme en contacto contigo sobre: ${contexto}`;
    }
  },

  /**
   * Genera un borrador de correo electrónico profesional.
   */
  async redactarCorreoGmail(clienteNombre: string, asunto: string, cuerpo: string): Promise<{asunto: string, contenido: string}> {
    try {
      const model = getAIModel();
      const prompt = `
        Eres el Director Estratégico de DESEO DIGITAL. Redacta un correo profesional.
        Para: ${clienteNombre}
        Propósito: ${asunto} - ${cuerpo}
        Responde en formato JSON: {"asunto": "...", "contenido": "..."}
      `;
      const result = await model.generateContent(prompt);
      return parseAIResponse(result.response.text());
    } catch (error) {
      return { asunto: asunto, contenido: cuerpo };
    }
  },

  /**
   * Analiza la rentabilidad financiera de la agencia.
   */
  async analizarSaludFinanciera(): Promise<string> {
    try {
      const [proyectos, oportunidades] = await Promise.all([ // Usar los servicios importados
        proyectosService.getAll(),
        oportunidadesService.getAll()
      ]);

      const model = getAIModel();
      
      // Preparamos un resumen numérico para la IA
      const resumen = {
        totalPresupuestado: proyectos.reduce((acc: number, p: any) => acc + (p.presupuesto || 0), 0),
        totalGastado: proyectos.reduce((acc: number, p: any) => acc + (p.costoActual || 0), 0),
        proyectosEnRiesgo: proyectos.filter((p: any) => (p.costoActual || 0) > (p.presupuesto || 0) * 0.8).length,
        pipelineVentas: oportunidades.reduce((acc: number, o: any) => acc + (o.valor || 0), 0)
      };

      const prompt = `
        Eres el CFO (Director Financiero) de DESEO DIGITAL. 
        Analiza estos números y dime la verdad cruda sobre la salud de la agencia:
        - Presupuesto total en curso: ${resumen.totalPresupuestado}
        - Costo operativo acumulado: ${resumen.totalGastado}
        - Proyectos quemando presupuesto (>80%): ${resumen.proyectosEnRiesgo}
        - Valor en Pipeline: ${resumen.pipelineVentas}

        Dime:
        1. ¿Estamos ganando dinero?
        2. ¿Qué proyecto debemos vigilar hoy mismo?
        3. Una estrategia para mejorar el flujo de caja.
        
        Formato: Markdown profesional y directo.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error en análisis financiero:", error);
      return "No pude realizar el análisis financiero en este momento.";
    }
  },

  /**
   * Agente Proactivo: Escanea el CRM buscando problemas, oportunidades de venta
   * y mejoras operativas sin intervención del usuario.
   */
  async realizarAuditoriaProactiva(): Promise<HallazgoAuditoria[]> {
    try {
      const [proyectos, clientes, oportunidades] = await Promise.all([ // Usar los servicios importados
        proyectosService.getAll(),
        clientesService.getAll(),
        oportunidadesService.getAll()
      ]);

      const model = getAIModel();
      const prompt = `
        Eres el Agente Proactivo de DESEO DIGITAL. Tu misión es analizar los datos y encontrar qué estamos haciendo mal o qué oportunidad estamos perdiendo.

        DATOS:
        - Proyectos: ${JSON.stringify(proyectos.map((p: any) => ({ n: p.nombre, e: p.estado, pr: p.progreso, f: p.fechaFin })))}
        - Clientes: ${JSON.stringify(clientes.map((c: any) => ({ n: c.nombre, i: c.ultima_interaccion })))}
        - Oportunidades: ${JSON.stringify(oportunidades.map((o: any) => ({ n: o.nombre, et: o.etapa, v: o.valor })))}

        INSTRUCCIONES:
        Identifica 3 hallazgos críticos. Sé específico (menciona nombres).
        Ejemplos: "El cliente X no tiene interacción hace 30 días", "El proyecto Y vence en 2 días y va al 40%".

        RESPONDE ÚNICAMENTE EN FORMATO JSON PURO (un array de objetos):
        [
          { "hallazgo": "...", "solucion": "...", "impacto": "...", "prioridad": "alta" }
        ]
      `;

      const result = await model.generateContent(prompt);
      const data = parseAIResponse(result.response.text());
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error en auditoría proactiva:", error);
      return [];
    }
  },

  /**
   * Genera un resumen ejecutivo para el Dashboard basado en el estado global del CRM.
   */
  async generarResumenDiario(): Promise<string> {
    try {
      const [proyectos, clientes, oportunidades] = await Promise.all([ // Usar los servicios importados
        proyectosService.getAll(),
        clientesService.getAll(),
        oportunidadesService.getAll()
      ]);

      const model = getAIModel();
      const prompt = `
        Eres el Asistente Ejecutivo de DESEO DIGITAL. Genera un "Daily Briefing" muy breve (máximo 150 palabras) basado en:
        - Clientes totales: ${clientes.length}
        - Proyectos activos: ${proyectos.filter((p: any) => p.estado === 'en_progreso').length}
        - Oportunidades en cierre: ${oportunidades.filter((o: any) => o.etapa === 'Cierre').length}
        - Proyectos con bajo progreso: ${proyectos.filter((p: any) => p.progreso < 30 && p.estado === 'en_progreso').map((p: any) => p.nombre).join(", ")}

        INSTRUCCIONES:
        1. Saluda al equipo de DESEO DIGITAL.
        2. Identifica la prioridad #1 del día.
        3. Da un mensaje motivador corto.
        
        Formato: Markdown directo, sin introducciones.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error al generar resumen diario:", error);
      return "Hoy es un gran día para impulsar DESEO DIGITAL. Revisa tus tareas pendientes para comenzar.";
    }
  },

  /**
   * Genera un resumen ejecutivo para el CEO basado en métricas y riesgos de hoy.
   */
  async generarResumenCEO(params: { ingresosHoy: number; tareasJessica: any[]; riesgos: any[] }): Promise<string> {
    try {
      const model = getAIModel();
      const prompt = `
        Eres el Business Partner y CFO Estratégico de DESEO DIGITAL.
        Juan José (el CEO) está revisando el dashboard de la agencia y necesita tu reporte ejecutivo rápido de hoy.

        MÉTRICAS DE HOY:
        - Recaudo potencial proyectado de hoy (50% anticipos de cierres): $${params.ingresosHoy} COP
        - Reels pendientes de edición por Jessica López: ${params.tareasJessica.length} reels
        - Proyectos en alto riesgo de entrega: ${params.riesgos.length} (${params.riesgos.map((p: any) => p.nombre).join(", ") || "Ninguno"})

        INSTRUCCIONES:
        1. Escribe un análisis ultra-conciso del estado del día (máximo 120 palabras).
        2. Tono: Premium, directo, motivador y orientado a números (en pesos COP).
        3. Identifica una acción crítica para Juan José hoy mismo (ej. cobrar anticipos, revisar edición con Jessica, o mitigar el proyecto en riesgo).

        Formato: Markdown directo con emojis de forma elegante.
      `;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error al generar resumen CEO:", error);
      return "Hola Juan José, hoy es un excelente día para revisar los proyectos en curso y los anticipos por recaudar. ¡Vamos a romperla en Deseo Digital!";
    }
  },

  /**
   * Formatea un texto para ser enviado vía URL de WhatsApp.
   */
  prepararEnlaceWhatsApp(telefono: string, mensaje: string): string {
    const numeroLimpio = telefono.replace(/[^\d]/g, "");
    const mensajeCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${numeroLimpio}?text=${mensajeCodificado}`;
  },

  /**
   * Genera una estrategia "Rompehielo" para WhatsApp basada en los dolores 
   * y necesidades capturados del cliente en campo.
   */
  async generarEstrategiaRompehielo(cliente: { nombre: string; empresa?: string; dolores?: string; necesidades?: string }): Promise<string> {
    try {
      const model = getAIModel();
      const prompt = `
        Eres el Senior Sales Strategist de DESEO DIGITAL. Juan (el CEO) acaba de recoger datos de campo de un prospecto.
        Tu misión es redactar un mensaje "Rompehielo" para WhatsApp que sea empático, profesional y genere una conexión inmediata.

        DATOS DEL CLIENTE:
        - Nombre: ${cliente.nombre}
        - Empresa: ${cliente.empresa || "No especificada"}
        - Dolor Detectado: ${cliente.dolores || "No especificado"}
        - Necesidad: ${cliente.necesidades || "No especificada"}

        INSTRUCCIONES PARA EL MENSAJE:
        1. Saludo personalizado con tono Colombiano Premium (amable, cercano pero respetuoso).
        2. Referencia directa al "Dolor" que el cliente mencionó. Ejemplo: "Me quedé pensando en lo que me comentaste sobre [Dolor]...".
        3. Mostrar autoridad de DESEO DIGITAL: demostrar de forma sutil que sabemos cómo resolver ese problema específico.
        4. Llamado a la acción (CTA) suave: Una pregunta abierta que invite a la conversación, no a la venta inmediata.
        5. Brevedad: El mensaje debe ser fácil de leer en un celular (máximo 3-4 párrafos cortos).
        6. Emojis: Usar 2 o 3 de forma profesional para dar calidez.

        Responde ÚNICAMENTE con el texto del mensaje para copiar y pegar.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error al generar rompehielo:", error);
      return `Hola ${cliente.nombre}, un gusto saludarte de nuevo. Me quedé pensando en los retos de ${cliente.empresa || 'tu marca'} que mencionamos hoy. ¿Te gustaría que habláramos unos minutos sobre cómo podemos darles solución?`;
    }
  }
  ,

  /**
   * Toma una propuesta en Markdown y la convierte en un resumen de texto plano amigable para WhatsApp.
   */
  async prepararPropuestaWhatsApp(propuestaMarkdown: string): Promise<string> {
    try {
      const model = getAIModel();
      const prompt = `
        Eres el Senior Account Manager de DESEO DIGITAL. 
        Toma la siguiente propuesta comercial en Markdown y conviértela en un mensaje de WhatsApp persuasivo y fácil de leer en móvil.
        
        REGLAS:
        1. Usa negritas con asteriscos (*texto*).
        2. Resume los puntos clave (Estrategia, Semanas de trabajo, Pago 50/50).
        3. Mantén el tono premium y amable de DESEO DIGITAL.
        4. Incluye un llamado a la acción claro para que el cliente confirme la cita o el inicio.

        PROPUESTA:
        ${propuestaMarkdown}
      `;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return propuestaMarkdown; // Fallback al original si falla
    }
  },

  /**
   * Genera un resumen de logros personalizado para el email de cierre.
   */
  async generarResumenCierreProyecto(proyecto: Proyecto): Promise<{asunto: string, cuerpo: string}> {
    try {
      const model = getAIModel();
      const prompt = `
        Eres el Customer Success Manager de DESEO DIGITAL. 
        Un proyecto ha finalizado al 100%. Redacta un email de cierre profesional y persuasivo.

        PROYECTO: ${proyecto.nombre}
        CLIENTE: ${proyecto.clienteNombre}
        SERVICIOS: ${proyecto.servicios?.join(", ")}
        DESCRIPCIÓN: ${proyecto.descripcion}
        TAREAS REALIZADAS: ${proyecto.tareas?.filter((t: any) => t.completada).map((t: any) => t.nombre).join(", ")}

        INSTRUCCIONES:
        1. Saluda y celebra el éxito.
        2. Resumen de LOGROS: 
           - Si hay SEO: Menciona visibilidad y estructura.
           - Si hay Reels/Social: Menciona la edición de Jessica y el impacto visual.
           - Si hay Web: Menciona velocidad y experiencia de usuario.
           - Si hay Pub. Física: Menciona calidad de entrega y gestión de proveedores.
        3. ENCUESTA DE SATISFACCIÓN: Incluye una sección invitando al cliente a calificar su experiencia del 1 al 5.
        4. RESEÑA DE GOOGLE: Solicita una reseña en nuestro perfil de Google usando este enlace exacto: https://www.google.com/search?q=agencia+deseo+digtla&sca_esv=c907fd948afe34b7&sxsrf=ANbL-n7cL2DEiPeksYuHS9mv8VEBk6tqFQ%3A1779076838624&source=hp&ei=5o4Kaoa2I5eRwbkPz7zp6Ac&iflsig=AFdpzrgAAAAAagqc9gRFJ1Wm10g_KB0ws15vKww0gviP&ved=0ahUKEwiGwffX-cGUAxWXSDABHU9eGn0Q4dUDCCM&uact=5&oq=agencia+deseo+digtla&gs_lp=Egdnd3Mtd2l6IhRhZ2VuY2lhIGRlc2VvIGRpZ3RsYTIFECEYoAFI5hRQAFjGE3AAeACQAQCYAacBoAGgFqoBBDAuMjC4AQPIAQD4AQGYAhSgArwXwgIKECMYgAQYigUYJ8ICBBAjGCfCAggQABiABBixA8ICBRAAGIAEwgIOEC4YgAQYsQMYxwEY0QPCAggQLhiABBixA8ICCxAAGIAEGLEDGMkDwgILEC4YgAQYxwEYrwHCAhQQLhiABBiKBRixAxiDARjHARjRA8ICCBAAGIAEGJIDwgILEAAYgAQYigUYkgPCAgsQLhivARjHARiABMICDRAuGIAEGMcBGNEDGArCAgcQABiABBgKwgIPEAAYgAQYChgLGLEDGMkDwgIJEAAYgAQYChgLwgIPEC4YChgLGK8BGMcBGIAEwgIMEAAYgAQYChgLGJIDwgIPEC4YgAQYChgLGMcBGNEDwgIGEAAYFhgewgICECbCAggQABiABBiiBMICBRAAGO8FwgIHECEYChigAZgDAJIHBDAuMjCgB6evAbIHBDAuMjC4B7wXwgcIMC41LjEzLjLIB2KACAE&sclient=gws-wiz#lrd=0x8e3e2fb9f791918f:0xb9c06b7463ea4cfd,3,,,,
        5. CIERRE: Tono premium, ejecutivo y agradecido.
        
        Responde ÚNICAMENTE en formato JSON: {"asunto": "...", "cuerpo": "..."}
      `;
      const result = await model.generateContent(prompt);
      return parseAIResponse(result.response.text());
    } catch (error) {
      return {
        asunto: `🚀 ¡Proyecto Finalizado! ${proyecto.nombre}`,
        cuerpo: `Estimado cliente, hemos completado con éxito todos los hitos de su proyecto. ¡Gracias por confiar en DESEO DIGITAL!`
      };
    }
  },

  /**
   * Punto 17 y 20: Análisis de Neuromarketing y Seguimiento Híbrido.
   * Genera estrategias de contacto basadas en sesgos cognitivos y psicología de ventas.
   */
  async generarSeguimientoHibrido(cliente: { nombre: string, empresa?: string, dolores?: string, nicho?: string }): Promise<{ whatsapp: string, gmail: { asunto: string, cuerpo: string }, sesgoUtilizado: string }> {
    try {
      const model = getAIModel();
      const prompt = `
        Eres un experto en Neuromarketing y Psicología del Consumidor de DESEO DIGITAL.
        Juan José acaba de registrar un lead y necesita el primer contacto de seguimiento.

        DATOS DEL CLIENTE:
        - Nombre: ${cliente.nombre}
        - Empresa: ${cliente.empresa || "No especificada"}
        - Dolor Principal: ${cliente.dolores || "Necesidad de visibilidad digital"}
        - Nicho: ${cliente.nicho || "General"}

        TAREA:
        1. Identifica el "Dolor Real" (el miedo o deseo profundo detrás de lo que dice).
        2. Selecciona un sesgo cognitivo para el mensaje (ej: Prueba Social, Escasez, Autoridad o Reciprocidad).
        3. Redacta un mensaje para WhatsApp (breve, directo, empático).
        4. Redacta un correo para Gmail (profesional, estructurado, premium).

        INSTRUCCIONES DE ESTILO:
        - Tono: Colombiano Premium (educado, cálido, pero muy ejecutivo).
        - No uses frases trilladas de vendedor.
        - Enfócate en que DESEO DIGITAL no vende servicios, vende SOLUCIONES al dolor detectado.

        RESPONDE ÚNICAMENTE EN JSON:
        {
          "whatsapp": "texto del mensaje...",
          "gmail": { "asunto": "...", "cuerpo": "..." },
          "sesgoUtilizado": "Nombre del sesgo y por qué se eligió"
        }
      `;

      const result = await model.generateContent(prompt);
      return parseAIResponse(result.response.text());
    } catch (error) {
      console.error("Error en Neuromarketing Service:", error);
      return {
        whatsapp: `Hola ${cliente.nombre}, un gusto saludarte de DESEO DIGITAL. Me quedé pensando en lo que mencionaste de ${cliente.empresa}...`,
        gmail: { asunto: "Propuesta de valor", cuerpo: "Hola..." },
        sesgoUtilizado: "Ninguno por error técnico"
      };
    }
  },

  /**
   * Registra el feedback de Juan sobre una respuesta de la IA.
   * Esto alimenta el "Aprendizaje de Small Data".
   */
  async registrarRetroalimentacion(pregunta: string, respuestaDada: string, correccion: string) {
    await logsService.create({
      accion: "Feedback IA",
      modulo: "Cerebro",
      detalle: { pregunta, respuestaDada, correccion },
      usuario: "Juan José Álvarez"
    });
  },

  /**
   * Sugiere paquetes de servicios basados en los dolores y necesidades capturados de un cliente.
   */
  async sugerirServiciosSegunDolores(cliente: { nombre: string; empresa?: string; dolores?: string; necesidades?: string; nicho?: string }): Promise<string> {
    try {
      const servicios = await serviciosService.getAll();
      const model = getAIModel();
      
      const prompt = `
        Eres el Growth Strategist Senior de DESEO DIGITAL. 
        Tu misión es analizar los "Dolores" y "Necesidades" que Juan José (CEO) ha capturado de un prospecto y sugerir la solución más efectiva de nuestro catálogo.

        DATOS DEL PROSPECTO:
        - Nombre: ${cliente.nombre}
        - Empresa: ${cliente.empresa || "No especificada"}
        - Nicho/Industria: ${cliente.nicho || "No especificado"}
        - Dolores (Problemas críticos): ${cliente.dolores || "No especificados (asume necesidad de crecimiento digital general)"}
        - Necesidades (Objetivos): ${cliente.necesidades || "No especificadas"}

        CATÁLOGO OFICIAL DE SERVICIOS EN SUPABASE:
        ${servicios.map(s => `- ${s.nombre} (${s.categoria}): ${s.descripcion}. Precio base: $${new Intl.NumberFormat('es-CO').format(s.precio_base)} COP`).join('\n')}

        REGLAS DE CUMPLIMIENTO LEGAL Y ÉTICA SEGÚN EL NICHO:
        - Si el nicho es "Salud": La estrategia debe priorizar la autoridad y la confianza profesional. Evita promesas agresivas de resultados médicos. Los servicios de Social Media y Ads sugeridos deben cumplir con las directrices de ética médica y publicidad de salud (ej. Supersalud en Colombia).
        - Si el nicho es "E-commerce": Enfócate en la seguridad transaccional, la transparencia en la política de devoluciones y el cumplimiento de la Ley del Consumidor y Habeas Data (protección de datos). Asegúrate de que los servicios de diseño web incluyan pasarelas seguras.
        - Para otros nichos: Mantén un enfoque orientado a resultados comerciales y crecimiento digital premium.

        INSTRUCCIONES PARA TU RECOMENDACIÓN:
        1. **Diagnóstico Estratégico**: Define brevemente cuál es el "cuello de botella" del cliente basándote en sus dolores.
        2. **Paquete Sugerido**: Recomienda la combinación de máximo 3 servicios que resolverán sus problemas de raíz.
        3. **Justificación ROI**: Explica por qué esta inversión es rentable para su nicho específico.
        4. **Tono**: Premium, experto, empático y muy profesional. Usa un estilo Colombiano Premium (amable pero orientado a negocios).

        Responde en formato Markdown estructurado y persuasivo para que Juan José pueda presentarlo.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error en sugerirServiciosSegunDolores:", error);
      return "No pude generar una sugerencia personalizada en este momento. Por favor, revisa el catálogo de servicios manualmente.";
    }
  },

  /**
   * Genera un documento (Brief, Contrato, etc.) basado en el conocimiento almacenado.
   */
  // Punto 14: Engine de Templates mejorado
  async generarDocumentoEstructurado(tipo: string, datos: any): Promise<string> {
    try {
      const conocimiento = await conocimientoService.getAll();
      const plantilla = conocimiento.find(c => c.categoria === 'templates' && c.titulo.toLowerCase().includes(tipo.toLowerCase()));
      
      const model = getAIModel();
      const dbPrompt = await promptsAIService.getBySlug('business_architect_documento');

      let prompt = "";
      if (dbPrompt) {
        prompt = fillTemplate(dbPrompt.user_prompt_template, { tipo, plantilla, datos });
      } else {
        prompt = `
        Eres el Business Architect y Consultor Senior de DESEO DIGITAL. 
        Tu tarea es redactar un **${tipo}** que sirva como diagnóstico profundo para la incursión al mundo digital.

        PLANTILLA DE PREGUNTAS Y ESTRUCTURA DE JUAN JOSÉ (CEO):
        ${plantilla ? plantilla.contenido : "Usa un formato estándar profesional de DESEO DIGITAL."}

        DATOS ACTUALES DEL CLIENTE/PROYECTO:
        ${JSON.stringify(datos)}

        INSTRUCCIONES:
        1. Usa las preguntas de la plantilla para evaluar la **identidad de la empresa** y su **madurez organizacional**.
        2. No te limites a llenar espacios; analiza si la empresa está bien estructurada para lo digital según los datos proporcionados.
        3. Si detectas que falta información crítica en la identidad o estructura, agrégala como una "Observación de Estrategia".
        4. El objetivo es que el cliente sienta que DESEO DIGITAL entiende quiénes son y qué necesitan corregir internamente para crecer.
        5. Tono: Premium, analítico, directo y altamente profesional.
      `;}

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return "Error al generar el documento.";
    }
  }
};
