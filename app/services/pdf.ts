import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generarFacturaPDF(factura: any, cliente: any = null, items?: any[]) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("FACTURA", 105, 15, { align: "center" } as any);

  doc.setFontSize(10);
  doc.text(`Número: ${factura.numero || factura.id}`, 14, 28);
  doc.text(`Fecha: ${factura.fecha_emision || new Date().toISOString().slice(0,10)}`, 14, 34);
  doc.text(`Estado pago: ${factura.estado_pago || factura.estado}`, 14, 40);

  let y = 52;
  if (cliente) {
    doc.text(`Cliente: ${cliente.nombre || cliente.empresa || "-"}`, 14, y);
    y += 6;
    doc.text(`Email: ${cliente.email || "-"}`, 14, y);
    y += 6;
    doc.text(`Teléfono: ${cliente.telefono || "-"}`, 14, y);
    y += 10;
  }

  const rows = (items || []).map((it: any) => [
    it.descripcion || it.concepto || "Servicio",
    it.cantidad || 1,
    it.precio || it.monto || 0,
    (it.cantidad || 1) * (it.precio || it.monto || 0),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Concepto", "Cant", "Precio", "Total"]],
    body: rows,
    theme: "grid",
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;

  doc.text(`Subtotal: ${factura.subtotal}`, 14, finalY + 10);
  doc.text(`IVA: ${factura.iva}`, 14, finalY + 16);
  doc.text(`Total: ${factura.total}`, 14, finalY + 22);

  doc.save(`factura-${factura.numero || factura.id}.pdf`);
  return doc;
}

export function generarContratoPDF(contrato: any, cliente: any = null) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("CONTRATO", 105, 15, { align: "center" } as any);

  doc.setFontSize(10);
  doc.text(`Número: ${contrato.numero || contrato.id}`, 14, 28);
  doc.text(`Tipo: ${contrato.tipo}`, 14, 34);
  doc.text(`Estado: ${contrato.estado}`, 14, 40);
  if (contrato.fecha_inicio) doc.text(`Inicio: ${contrato.fecha_inicio}`, 14, 46);
  if (contrato.fecha_fin) doc.text(`Fin: ${contrato.fecha_fin}`, 14, 52);
  if (contrato.valor) doc.text(`Valor: ${contrato.valor}`, 14, 58);

  const split = doc.splitTextToSize(contrato.contenido || "", 180);
  doc.text(split, 14, 70);

  doc.save(`contrato-${contrato.numero || contrato.id}.pdf`);
  return doc;
}

export function linkWhatsApp(telefono: string, mensaje: string) {
  const limpio = (telefono || "").replace(/\D/g, "");
  const url = `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
  return url;
}
