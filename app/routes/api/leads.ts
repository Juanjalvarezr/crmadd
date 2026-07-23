import { supabase } from "../services/supabase";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, message: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const nombre = String(body.nombre || "").trim();
    const empresa = String(body.empresa || "").trim();
    const email = String(body.email || "").trim();
    const telefono = String(body.telefono || "").trim();
    const servicio = String(body.servicio || "").trim();
    const mensaje = String(body.mensaje || "").trim();
    const origen = "web_landing";

    if (!nombre || !empresa || !email) {
      return new Response(JSON.stringify({ ok: false, message: "Faltan campos obligatorios: nombre, empresa y email." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre: `${nombre}${empresa ? ` - ${empresa}` : ""}`,
        email,
        telefono: telefono || null,
        empresa,
        origen,
        estado: "Activo",
        necesidades: mensaje || null,
        intereses: servicio ? [servicio] : [],
        lead_score: 50,
        lead_score_last_updated: new Date().toISOString(),
        ultima_interaccion: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("[LEADS] Error insertando lead:", error);
      return new Response(JSON.stringify({ ok: false, message: error.message || "Error al guardar el lead." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("[LEADS] Error inesperado:", err);
    return new Response(JSON.stringify({ ok: false, message: "Error inesperado al procesar el formulario." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
