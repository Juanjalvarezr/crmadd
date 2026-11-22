import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs';

// --- env (sin secretos hardcodeados) ---
const env = {};
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}
const URL = env.VITE_SUPABASE_URL.replace(/\/$/, '');
const ANON = env.VITE_SUPABASE_ANON_KEY;
const CRM_PASS = process.env.CRM_PASS || '';
const PHONE = '573203698476';
const NOMBRE = 'Juan José Álvarez (Prueba E2E)';
const log = (...a) => console.log(...a);
if (!CRM_PASS) { log('FALTA CRM_PASS en el entorno'); process.exit(1); }

async function api(method, path, { token, body, headers, raw } = {}) {
  const h = { apikey: ANON, Authorization: `Bearer ${token || ANON}` };
  if (!raw) h['Content-Type'] = 'application/json';
  Object.assign(h, headers || {});
  const data = raw ? body : body !== undefined ? JSON.stringify(body) : undefined;
  const r = await fetch(URL + path, { method, headers: h, body: data });
  const txt = await r.text();
  let json; try { json = JSON.parse(txt); } catch { json = txt; }
  return { status: r.status, json, txt };
}

// --- login ---
const login = await api('POST', '/auth/v1/token?grant_type=password', {
  body: { email: 'emprende.villavo@gmail.com', password: CRM_PASS },
});
if (login.status !== 200) { log('LOGIN FAIL', login.status, login.txt.slice(0, 200)); process.exit(1); }
const TOK = login.json.access_token;
log('login OK');

// --- PDF ---
async function makePdf(titulo, lineas, total) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pink = rgb(0.91, 0.12, 0.38);
  let y = 800;
  page.drawText('DESEO DIGITAL', { x: 50, y, size: 22, font: bold, color: pink }); y -= 18;
  page.drawText('Agencia Inteligente · Villavicencio · 320 369 8476', { x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) }); y -= 40;
  page.drawText(titulo, { x: 50, y, size: 16, font: bold }); y -= 24;
  page.drawText(`Cliente: ${NOMBRE}`, { x: 50, y, size: 11, font }); y -= 16;
  page.drawText(`Teléfono: ${PHONE}`, { x: 50, y, size: 11, font }); y -= 16;
  page.drawText(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, { x: 50, y, size: 11, font }); y -= 28;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) }); y -= 22;
  for (const ln of lineas) { page.drawText(ln, { x: 50, y, size: 11, font }); y -= 18; }
  y -= 12;
  page.drawText(`TOTAL: ${total}`, { x: 50, y, size: 14, font: bold, color: pink }); y -= 30;
  page.drawText('Documento de prueba para validar el flujo CRM -> n8n -> OpenWA.', { x: 50, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
  return Buffer.from(await doc.save());
}

async function uploadDoc(tipo, bytes, clienteId) {
  const path = `${tipo}/${tipo}-e2e-${Date.now()}.pdf`;
  const up = await api('POST', `/storage/v1/object/crm-documents/${path}`, {
    token: TOK, body: bytes, raw: true, headers: { 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
  });
  if (up.status !== 200 && up.status !== 201) { log('UPLOAD FAIL', tipo, up.status, up.txt.slice(0, 200)); return null; }
  const url = `${URL}/storage/v1/object/public/crm-documents/${path}`;
  const ins = await api('POST', '/rest/v1/documentos', {
    token: TOK, body: { titulo: `${tipo} E2E`, tipo, url, cliente_id: clienteId, descripcion: 'Prueba punta a punta' },
    headers: { Prefer: 'return=representation' },
  });
  log(`doc ${tipo}: upload ${up.status}, documentos ${ins.status}`);
  return url;
}

// --- cliente ---
let clienteId;
const find = await api('GET', `/rest/v1/clientes?telefono=eq.${PHONE}&select=id,nombre`, { token: TOK });
if (Array.isArray(find.json) && find.json.length) { clienteId = find.json[0].id; log('cliente existente', clienteId); }
else {
  const ins = await api('POST', '/rest/v1/clientes', {
    token: TOK, body: { nombre: NOMBRE, telefono: PHONE, email: 'jujoalri@hotmail.com', empresa: 'DESEO DIGITAL', etapa: 'nuevo' },
    headers: { Prefer: 'return=representation' },
  });
  if (ins.status !== 201) { log('CLIENTE FAIL', ins.status, ins.txt.slice(0, 300)); process.exit(1); }
  clienteId = ins.json[0].id; log('cliente creado', clienteId);
}

// --- documentos ---
const docs = {};
docs.propuesta = await uploadDoc('propuesta', await makePdf('PROPUESTA COMERCIAL',
  ['Servicio: Gestión de redes sociales + SEO local', 'Incluye: 12 publicaciones/mes, 4 reels, informe mensual', 'Duración: 3 meses'], '$1.500.000 COP/mes'), clienteId);
docs.cotizacion = await uploadDoc('cotizacion', await makePdf('COTIZACIÓN #E2E-001',
  ['Ítem 1: Diseño de identidad visual — $800.000', 'Ítem 2: Landing page + SEO — $1.200.000', 'Validez: 15 días'], '$2.000.000 COP'), clienteId);
docs.factura = await uploadDoc('factura', await makePdf('FACTURA #E2E-001',
  ['Servicio: Anticipo 50% gestión digital', 'Vencimiento: ' + new Date(Date.now() + 8 * 86400000).toLocaleDateString('es-CO'), 'Estado: Pendiente de pago'], '$1.000.000 COP'), clienteId);

// --- canal / contacto / conversacion ---
const ch = await api('GET', `/rest/v1/channels?codigo=eq.openwa&select=id`, { token: TOK });
const channelId = ch.json[0].id;
const contact = await api('POST', '/rest/v1/channel_contacts', {
  token: TOK, body: { channel_id: channelId, external_id: PHONE, nombre: NOMBRE, telefono: PHONE },
  headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
});
let contactId = Array.isArray(contact.json) ? contact.json[0]?.id : null;
if (!contactId) { const g = await api('GET', `/rest/v1/channel_contacts?channel_id=eq.${channelId}&external_id=eq.${PHONE}&select=id`, { token: TOK }); contactId = g.json[0]?.id; }
const conv = await api('POST', '/rest/v1/conversations', {
  token: TOK, body: { channel_id: channelId, contact_id: contactId, estado: 'abierta', ultimo_mensaje: 'Prueba E2E' },
  headers: { Prefer: 'return=representation' },
});
let convId = Array.isArray(conv.json) ? conv.json[0]?.id : null;
if (!convId) { const g = await api('GET', `/rest/v1/conversations?channel_id=eq.${channelId}&contact_id=eq.${contactId}&select=id`, { token: TOK }); convId = g.json[0]?.id; }
log('channel', channelId, 'contact', contactId, 'conversation', convId);

// --- outbound (cola n8n Salientes) ---
const mensajes = [
  { tipo: 'propuesta', cuerpo: `Hola Juan José, soy el equipo de DESEO DIGITAL. Preparamos una propuesta para gestión de redes + SEO. Documento: ${docs.propuesta}\n\nQuedo atento a tus comentarios.` },
  { tipo: 'cotizacion', cuerpo: `Hola Juan José, de DESEO DIGITAL te compartimos la cotización de identidad visual + landing por $2.000.000. Documento: ${docs.cotizacion}\n\nQuedamos atentos para ajustar lo que necesites.` },
  { tipo: 'factura', cuerpo: `Hola Juan José, de DESEO DIGITAL te enviamos la factura por $1.000.000 (anticipo 50%). Documento: ${docs.factura}\n\nGracias por tu confianza.` },
];
for (const m of mensajes) {
  const r = await api('POST', '/rest/v1/conversation_messages', {
    token: TOK, body: { conversation_id: convId, direccion: 'outbound', tipo: 'texto', cuerpo: m.cuerpo, media_url: docs[m.tipo] || null, estado: 'pending', enviado_por: 'crm' },
    headers: { Prefer: 'return=representation' },
  });
  log(`outbound ${m.tipo}: ${r.status}`, Array.isArray(r.json) ? 'id ' + r.json[0]?.id : r.txt.slice(0, 150));
}

// --- seguimientos (3 programados + 1 inmediato) ---
const segRows = [
  { dias: 1, tipo: 'Seguimiento 24h', mensaje: 'Hola Juan José, ¿recibiste nuestra propuesta? Quedamos atentos.' },
  { dias: 3, tipo: 'Seguimiento 3 dias', mensaje: 'Hola Juan José, pasaron 3 días. ¿Agendamos una llamada?' },
  { dias: 7, tipo: 'Seguimiento 7 dias', mensaje: 'Hola Juan José, ¿te enviamos una propuesta ajustada?' },
].map((s) => ({ cliente_id: clienteId, cliente_nombre: NOMBRE, telefono: PHONE, tipo: s.tipo, mensaje: s.mensaje, programado_para: new Date(Date.now() + s.dias * 86400000).toISOString(), estado: 'pendiente' }));
segRows.push({ cliente_id: clienteId, cliente_nombre: NOMBRE, telefono: PHONE, tipo: 'Seguimiento INMEDIATO (prueba)', mensaje: 'Hola Juan José, este es un seguimiento de prueba inmediato del flujo automático DESEO DIGITAL.', programado_para: new Date(Date.now() - 60000).toISOString(), estado: 'pendiente' });
const seg = await api('POST', '/rest/v1/seguimientos', { token: TOK, body: segRows, headers: { Prefer: 'return=representation' } });
log('seguimientos:', seg.status, Array.isArray(seg.json) ? seg.json.length + ' filas' : seg.txt.slice(0, 200));
log('\n=== ENCOLADO. conversation_id', convId, 'cliente_id', clienteId, '===');
