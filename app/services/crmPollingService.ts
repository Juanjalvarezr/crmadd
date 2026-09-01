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
  // Por ahora usa un destinatario genérico; después esto se carga desde configuracion_empresa o roles
  return ["onboarding@resend.dev"];
}

async function safeSendEmail(subject: string, html: string) {
  const to = getRecipientsForEvent(subject);
  try {
    const res = await emailService.sendRealEmail(to, subject, html);
    console.log("[polling] email enviado", res);
  } catch (e) {
    console.error("[polling] error enviando email", e);
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
