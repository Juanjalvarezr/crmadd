import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND = {
  primary: "#0f172a",
  accent: "#2563eb",
  text: "#1e293b",
  muted: "#64748b",
  light: "#f8fafc",
};

function drawBrandHeader(doc: any, title: string, subtitle?: string) {
  const r = parseInt(BRAND.primary.slice(1, 3), 16);
  const g = parseInt(BRAND.primary.slice(3, 5), 16);
  const b = parseInt(BRAND.primary.slice(5, 7), 16);
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 220, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 16, 16);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 16, 24);
  }
}

function drawMeta(doc: any, x: number, y: number, fields: { label: string; value?: string }[]) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let cy = y;
  const muted = [parseInt(BRAND.muted.slice(1, 3), 16), parseInt(BRAND.muted.slice(3, 5), 16), parseInt(BRAND.muted.slice(5, 7), 16)];
  const text = [parseInt(BRAND.text.slice(1, 3), 16), parseInt(BRAND.text.slice(3, 5), 16), parseInt(BRAND.text.slice(5, 7), 16)];
  for (const f of fields) {
    doc.setTextColor(...muted);
    doc.text(f.label, x, cy);
    cy += 5;
    if (f.value) {
      doc.setTextColor(...text);
      doc.setFont("helvetica", "bold");
      doc.text(f.value, x, cy);
      doc.setFont("helvetica", "normal");
      cy += 6;
    } else {
      cy += 2;
    }
  }
  return cy;
}

function formatCOP(value: number) {
  return `$${Number(value || 0).toLocaleString("es-CO")}`;
}

export async function generarFacturaPDF(factura: any, cliente: any = null, items?: any[]) {
  const doc = new jsPDF();
  drawBrandHeader(doc, "FACTURA", "DESEO DIGITAL - Agencia Inteligente");

  let y = 40;
  if (cliente) {
    drawMeta(doc, 14, y, [
      { label: "CLIENTE", value: cliente.nombre || cliente.empresa || "-" },
      { label: "EMAIL", value: cliente.email || "-" },
      { label: "TELÉFONO", value: cliente.telefono || "-" },
    ]);
    y += 36;
  }

  const metaFields = [
    { label: "NÚMERO", value: String(factura.numero || factura.id || "-") },
    { label: "FECHA", value: factura.fecha_emision || new Date().toISOString().slice(0, 10) },
    { label: "ESTADO", value: String(factura.estado_pago || factura.estado || "-") },
  ];
  drawMeta(doc, 120, 40, metaFields);

  const rows = (items || []).map((it: any) => [
    it.descripcion || it.concepto || "Servicio",
    String(it.cantidad || 1),
    formatCOP(it.precio || it.monto || 0),
    formatCOP((it.cantidad || 1) * (it.precio || it.monto || 0)),
  ]);

  autoTable(doc, {
    startY: Math.max(y, 70),
    head: [["Concepto", "Cant", "Precio", "Total"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10 },
    foot: [
      [
        { content: "Subtotal", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
        { content: formatCOP(factura.subtotal || 0), styles: { halign: "right" } },
      ],
      [
        { content: "IVA", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
        { content: formatCOP(factura.iva || 0), styles: { halign: "right" } },
      ],
      [
        { content: "Total", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
        { content: formatCOP(factura.total || 0), styles: { halign: "right", fontStyle: "bold" } },
      ],
    ],
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  doc.setFontSize(8);
  const muted2 = [parseInt(BRAND.muted.slice(1, 3), 16), parseInt(BRAND.muted.slice(3, 5), 16), parseInt(BRAND.muted.slice(5, 7), 16)];
  doc.setTextColor(...muted2);
  doc.text("DESEO DIGITAL - Agencia Inteligente - nit. 000.000.000", 14, finalY + 12);
  doc.text("www.deseodigital.com - hola@deseodigital.com", 14, finalY + 18);

  const blob = doc.output("blob");
  return blob;
}

export async function generarContratoPDF(contrato: any, cliente: any = null) {
  const doc = new jsPDF();
  drawBrandHeader(doc, "CONTRATO", "DESEO DIGITAL - Agencia Inteligente");

  let y = 40;
  if (cliente) {
    drawMeta(doc, 14, y, [
      { label: "CLIENTE", value: cliente.nombre || cliente.empresa || "-" },
      { label: "EMAIL", value: cliente.email || "-" },
      { label: "TELÉFONO", value: cliente.telefono || "-" },
    ]);
    y += 36;
  }

  const metaFields = [
    { label: "NÚMERO", value: String(contrato.numero || contrato.id || "-") },
    { label: "TIPO", value: String(contrato.tipo || "-") },
    { label: "ESTADO", value: String(contrato.estado || "-") },
    { label: "VERSIÓN", value: String(contrato.version || 1) },
  ];
  drawMeta(doc, 120, 40, metaFields);

  if (contrato.fecha_inicio) doc.text(`Inicio: ${contrato.fecha_inicio}`, 14, y + 18);
  if (contrato.fecha_fin) doc.text(`Fin: ${contrato.fecha_fin}`, 14, y + 26);
  if (contrato.valor) doc.text(`Valor: ${formatCOP(contrato.valor)}`, 14, y + 34);

  const split = doc.splitTextToSize(contrato.contenido || "", 180);
  doc.setFontSize(9);
  doc.text(split, 14, y + 52);

  // Bloque de firma simulada
  const baseY = y + 52 + split.length * 4 + 50;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(14, baseY - 12, 180, 46);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("FIRMA DIGITAL SIMULADA", 20, baseY);

  if (contrato.firma_datos) {
    const fd = contrato.firma_datos;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${fd.nombre || '-'}`, 20, baseY + 8);
    if (fd.dni) doc.text(`DNI/ID: ${fd.dni}`, 20, baseY + 14);
    doc.text(`Fecha: ${fd.fecha || new Date().toISOString()}`, 20, baseY + 20);
    if (fd.dispositivo) doc.text(`Dispositivo: ${fd.dispositivo}`, 20, baseY + 26);
    doc.text("Estado: Firmado electrónicamente (simulado)", 20, baseY + 32);
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Pendiente de firma electrónica", 20, baseY + 8);
  }

  const finalY = (doc as any).lastAutoTable?.finalY || baseY + 80;
  doc.setFontSize(8);
  doc.setTextColor(...[parseInt(BRAND.muted.slice(1, 3), 16), parseInt(BRAND.muted.slice(3, 5), 16), parseInt(BRAND.muted.slice(5, 7), 16)]);
  doc.text("DESEO DIGITAL - Agencia Inteligente - nit. 000.000.000", 14, finalY + 12);
  doc.text("www.deseodigital.com - hola@deseodigital.com", 14, finalY + 18);

  const blob = doc.output("blob");
  return blob;
}

export function linkWhatsApp(telefono: string, mensaje: string) {
  const limpio = (telefono || "").replace(/\D/g, "");
  const url = `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
  return url;
}
