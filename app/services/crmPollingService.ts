import { supabase, emailService } from "./supabase";

export type CrmEvent = {
  id: number;
  tipo: string;
  payload: any;
  leido: boolean;
  created_at: string;
};

type EventHandler = (payload: any, eventId: number) => Promise<void> | void;

const handlers: Record<string, EventHandler> = {};

function getRecipientsForEvent(tipo: string): string[] {
  // Ajustar a los destinatarios reales del negocio
  return ["onboarding@resend.dev"];
}

async function safeSendEmail(to: string[], subject: string, html: string) {
  try {
    const res = await emailService.sendRealEmail(to, subject, html);
    console.log("[polling] email enviado", res);
  } catch (e) {
    console.error("[polling] error enviando email", e);
  }
}

async function upsertDocumento(payload: {
  titulo?: string;
  tipo?: string;
  url?: string | null;
  proyecto_id?: string | null;
  cliente_id?: string | null;
  factura_id?: string | null;
  descripcion?: string | null;
}) {
  const row = {
    titulo: payload.titulo ?? "Documento",
    tipo: payload.tipo ?? "general",
    url: payload.url ?? null,
    proyecto_id: payload.proyecto_id ?? null,
    cliente_id: payload.cliente_id ?? null,
    factura_id: payload.factura_id ?? null,
    descripcion: payload.descripcion ?? null,
  };

  const { error } = await supabase.from("documentos").insert([row]);
  if (error) {
    console.error("[polling] error guardando documento", error);
  }
}

async function auditLog(modulo: string, accion: string, detalle: any) {
  const { error } = await supabase.from("logs").insert([
    {
      modulo,
      accion,
      detalle,
      usuario: "system",
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) {
    console.error("[polling] error audit log", error);
  }
}

export const crmPollingService = {
  register(tipo: string, handler: EventHandler) {
    handlers[tipo] = handler;
  },

  async tick() {
    const { data, error } = await supabase
      .from("crm_events")
      .select("*")
      .eq("leido", false)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[crmPolling] error leyendo eventos", error);
      return;
    }

    if (!data || data.length === 0) return;

    for (const evt of data) {
      const fn = handlers[evt.tipo];
      if (!fn) {
        console.warn("[crmPolling] sin handler para", evt.tipo);
        await supabase.from("crm_events").update({ leido: true }).eq("id", evt.id);
        continue;
      }

      try {
        await fn(evt.payload, evt.id);
        await supabase.from("crm_events").update({ leido: true }).eq("id", evt.id);
      } catch (e) {
        console.error("[crmPolling] fallo handler", evt.tipo, e);
      }
    }
  }
};

// Fase 1 - Lógica de negocio por evento
handlers["factura_pagada"] = async (payload) => {
  const total = Number(payload.total || 0);
  const facturaId = payload.factura_id;

  // Regla: notificar siempre al equipo
  await safeSendEmail(
    getRecipientsForEvent("factura_pagada"),
    `Factura pagada #${facturaId}`,
    `<p>Factura #${facturaId} por $${total.toFixed(0)} marcada como pagada.</p>`
  );

  // Regla: si tiene monto, guardar documento
  if (total > 0) {
    await upsertDocumento({
      titulo: `Factura #${facturaId}`,
      tipo: "factura",
      url: null,
      factura_id: facturaId ? String(facturaId) : null,
      proyecto_id: payload.proyecto_id ?? null,
      cliente_id: payload.cliente_id ?? null,
      descripcion: "Generada automáticamente al pagar",
    });
  }

  await auditLog("facturacion", "factura_pagada", { factura_id: facturaId, total });
};

handlers["cotizacion_guardada"] = async (payload) => {
  const cotizacionId = payload.cotizacion_id;
  const estado = payload.estado || "Borrador";

  await safeSendEmail(
    getRecipientsForEvent("cotizacion_guardada"),
    `Cotización guardada #${cotizacionId}`,
    `<p>Cotización #${cotizacionId} en estado ${estado}.</p>`
  );

  await upsertDocumento({
    titulo: `Cotización #${cotizacionId}`,
    tipo: "cotizacion",
    url: null,
    proyecto_id: payload.proyecto_id ?? null,
    cliente_id: payload.cliente_id ?? null,
    descripcion: `Estado: ${estado}`,
  });

  // Regla de negocio: si está enviada, crear follow-up
  if (estado === "Enviada") {
    await supabase.from("tareas").insert([
      {
        titulo: `Seguimiento cotización #${cotizacionId}`,
        estado: "Pendiente",
        prioridad: "Media",
        cliente_id: payload.cliente_id ?? null,
        proyecto_id: payload.proyecto_id ?? null,
      },
    ]);
  }

  await auditLog("cotizaciones", "cotizacion_guardada", { cotizacion_id: cotizacionId, estado });
};

handlers["tarea_guardada"] = async (payload) => {
  const tareaId = payload.tarea_id;
  const estado = payload.estado || "Pendiente";

  await safeSendEmail(
    getRecipientsForEvent("tarea_guardada"),
    `Tarea #${tareaId}`,
    `<p>Tarea actualizada a estado ${estado}.</p>`
  );

  await auditLog("tareas", "tarea_guardada", { tarea_id: tareaId, estado });
};

handlers["documento_creado"] = async (payload) => {
  const titulo = payload.titulo;
  const tipo = payload.tipo;

  await safeSendEmail(
    getRecipientsForEvent("documento_creado"),
    `Documento creado: ${titulo}`,
    `<p>Documento <strong>${titulo}</strong> tipo ${tipo}.</p>`
  );

  await auditLog("documentos", "documento_creado", { titulo, tipo });
};

handlers["email_enviado"] = async (payload) => {
  await auditLog("email", "email_enviado", payload);
};
