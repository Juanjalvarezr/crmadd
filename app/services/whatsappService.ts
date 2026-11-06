import { supabase } from "./supabase";
import { plantillasMensaje, detectarSector } from "../utils/plantillasMensaje";

export const whatsappService = {
  async send(telefono: string, mensaje: string) {
    const encoded = encodeURIComponent(mensaje);
    const url = `https://wa.me/${telefono}?text=${encoded}`;
    if (typeof window !== "undefined") window.open(url, "_blank");
    return { ok: true as const, url };
  },

  getTemplate(p: { nombre: string; tipo_negocio?: string; ubicacion?: string }) {
    const sector = detectarSector(p.nombre, p.tipo_negocio);
    let mensaje = plantillasMensaje[sector].texto;
    // Replace placeholders
    mensaje = mensaje.replace(/\[nombre del hotel\]/g, p.nombre);
    mensaje = mensaje.replace(/\[nombre del negocio\]/g, p.nombre);
    mensaje = mensaje.replace(/\[ciudad\]/g, p.ubicacion || 'Villavicencio');
    return { sector: plantillasMensaje[sector].titulo, mensaje };
  },
};
