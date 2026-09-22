import { supabase } from "./supabase";

export const whatsappService = {
  async send(telefono: string, mensaje: string) {
    const encoded = encodeURIComponent(mensaje);
    const url = `https://wa.me/${telefono}?text=${encoded}`;
    if (typeof window !== "undefined") window.open(url, "_blank");
    try {
      const { crmEventsService } = await import("./crmPollingService");
      await crmEventsService.create("whatsapp_enviado", { telefono, mensaje });
    } catch {}
    return { ok: true as const, url };
  }
};
