import { supabase } from "./supabase";

const BRAND = {
  name: "DESEO DIGITAL",
  primary: "#E91E63",
  secondary: "#9C27B0",
  text: "#222",
  muted: "#666",
};

function htmlDocument(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.text}; margin: 0; padding: 24px; }
  .wrap { max-width: 900px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .brand { display: flex; flex-direction: column; gap: 6px; }
  .brand-name { font-size: 22px; font-weight: 800; color: ${BRAND.primary}; letter-spacing: -0.02em; }
  .brand-sub { font-size: 12px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 0.15em; }
  .title { font-size: 18px; font-weight: 700; color: ${BRAND.text}; }
  .meta { font-size: 12px; color: ${BRAND.muted}; }
  .section { margin-top: 18px; }
  .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: ${BRAND.muted}; margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
  .label { font-size: 11px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 0.08em; }
  .value { font-size: 14px; font-weight: 600; color: ${BRAND.text}; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
  th { text-align: left; padding: 10px 8px; border-bottom: 2px solid ${BRAND.primary}; color: ${BRAND.muted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
  td { padding: 10px 8px; border-bottom: 1px solid #eee; }
  .right { text-align: right; }
  .footer { margin-top: 26px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: ${BRAND.muted}; display: flex; justify-content: space-between; }
  .accent { background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary}); color: #fff; padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
  .accent .label { color: rgba(255,255,255,0.8); }
  .accent .value { color: #fff; font-size: 16px; }
  @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } .header { flex-direction: column; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="brand">
        <div class="brand-name">${BRAND.name}</div>
        <div class="brand-sub">Agencia Inteligente</div>
      </div>
      <div style="text-align:right">
        <div class="title">${title}</div>
        <div class="meta">Generado automáticamente</div>
      </div>
    </div>
    <div class="section">
      ${body}
    </div>
    <div class="footer">
      <div>${BRAND.name} • contacto@deseodigital.com</div>
      <div>Documento oficial • ${new Date().toLocaleDateString("es-CO")}</div>
    </div>
  </div>
</body>
</html>`;
}

export const documentGenerator = {
  async factura(factura: any) {
    const cliente = factura.cliente_nombre || factura.cliente_id || "Cliente";
    const total = Number(factura.total || factura.monto || 0);
    const estado = factura.estado || "Pendiente";
    const numero = factura.id || String(Date.now());
    const body = `
      <div class="grid">
        <div class="card">
          <div class="label">Cliente</div>
          <div class="value">${cliente}</div>
        </div>
        <div class="card">
          <div class="label">Número / ID</div>
          <div class="value">#${numero}</div>
        </div>
        <div class="card">
          <div class="label">Estado</div>
          <div class="value">${estado}</div>
        </div>
        <div class="card">
          <div class="label">Fecha</div>
          <div class="value">${factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleDateString("es-CO") : new Date().toLocaleDateString("es-CO")}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Detalle</div>
        <table>
          <thead><tr><th>Concepto</th><th class="right">Monto</th></tr></thead>
          <tbody>
            <tr><td>Factura #${numero}</td><td class="right">$${total.toLocaleString("es-CO")}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="accent">
        <div><div class="label">Total</div><div class="value">$${total.toLocaleString("es-CO")}</div></div>
        <div style="text-align:right"><div class="label">Estado</div><div class="value">${estado}</div></div>
      </div>
    `;
    return htmlDocument(`Factura #${numero}`, body);
  },

  async cotizacion(cotizacion: any) {
    const cliente = cotizacion.cliente_nombre || cotizacion.cliente_id || "Cliente";
    const total = Number(cotizacion.total || cotizacion.monto || 0);
    const estado = cotizacion.estado || "Borrador";
    const numero = cotizacion.id || String(Date.now());
    const body = `
      <div class="grid">
        <div class="card">
          <div class="label">Cliente</div>
          <div class="value">${cliente}</div>
        </div>
        <div class="card">
          <div class="label">Cotización</div>
          <div class="value">#${numero}</div>
        </div>
        <div class="card">
          <div class="label">Estado</div>
          <div class="value">${estado}</div>
        </div>
        <div class="card">
          <div class="label">Vencimiento</div>
          <div class="value">${cotizacion.fecha_vencimiento ? new Date(cotizacion.fecha_vencimiento).toLocaleDateString("es-CO") : "-"}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Resumen</div>
        <table>
          <thead><tr><th>Concepto</th><th class="right">Monto</th></tr></thead>
          <tbody>
            <tr><td>Cotización #${numero}</td><td class="right">$${total.toLocaleString("es-CO")}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="accent">
        <div><div class="label">Total</div><div class="value">$${total.toLocaleString("es-CO")}</div></div>
        <div style="text-align:right"><div class="label">Estado</div><div class="value">${estado}</div></div>
      </div>
    `;
    return htmlDocument(`Cotización #${numero}`, body);
  },

  async contrato(contrato: any) {
    const cliente = contrato.cliente_nombre || contrato.cliente_id || "Cliente";
    const valor = Number(contrato.valor || contrato.total || 0);
    const estado = contrato.estado || "Borrador";
    const numero = contrato.id || String(Date.now());
    const body = `
      <div class="grid">
        <div class="card">
          <div class="label">Cliente</div>
          <div class="value">${cliente}</div>
        </div>
        <div class="card">
          <div class="label">Contrato</div>
          <div class="value">#${numero}</div>
        </div>
        <div class="card">
          <div class="label">Estado</div>
          <div class="value">${estado}</div>
        </div>
        <div class="card">
          <div class="label">Valor</div>
          <div class="value">$${valor.toLocaleString("es-CO")}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Términos</div>
        <div class="card">
          <div class="label">Alcance</div>
          <div class="value">${contrato.descripcion || "Servicios de agencia digital."}</div>
          <div style="margin-top:10px" class="label">Vigencia</div>
          <div class="value">${contrato.fecha_inicio ? new Date(contrato.fecha_inicio).toLocaleDateString("es-CO") : "-"} — ${contrato.fecha_fin ? new Date(contrato.fecha_fin).toLocaleDateString("es-CO") : "-"}</div>
        </div>
      </div>
      <div class="accent">
        <div><div class="label">Valor</div><div class="value">$${valor.toLocaleString("es-CO")}</div></div>
        <div style="text-align:right"><div class="label">Estado</div><div class="value">${estado}</div></div>
      </div>
    `;
    return htmlDocument(`Contrato #${numero}`, body);
  },

  async propuesta(datos: { clienteNombre?: string; clienteEmpresa?: string; servicios?: string[]; notasAdicionales?: string }) {
    const servicios = (datos.servicios || []).join(", ") || "Servicios digitales";
    const body = `
      <div class="grid">
        <div class="card">
          <div class="label">Cliente</div>
          <div class="value">${datos.clienteNombre || "-"}</div>
        </div>
        <div class="card">
          <div class="label">Empresa</div>
          <div class="value">${datos.clienteEmpresa || "-"}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Servicios</div>
        <div class="card"><div class="value">${servicios}</div></div>
      </div>
      ${datos.notasAdicionales ? `<div class="section"><div class="section-title">Notas</div><div class="card"><div class="value">${datos.notasAdicionales}</div></div></div>` : ""}
      <div class="accent">
        <div><div class="label">Documento</div><div class="value">Propuesta comercial</div></div>
        <div style="text-align:right"><div class="label">Generado</div><div class="value">${new Date().toLocaleDateString("es-CO")}</div></div>
      </div>
    `;
    return htmlDocument("Propuesta comercial", body);
  },
};
