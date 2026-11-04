// Generador de PDFs con pdf-lib (bytes reales para subir a storage)
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const BRAND = { name: "DESEO DIGITAL", primary: [0.91, 0.12, 0.39] as const };

function fmtMoney(n: any) {
  const v = Number(n ?? 0);
  return `$${v.toLocaleString("es-CO")}`;
}

function fmtDate(d: any) {
  if (!d) return new Date().toLocaleDateString("es-CO");
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("es-CO");
}

async function buildPdf(tipo: string, datos: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const primary = rgb(...BRAND.primary);
  const black = rgb(0.13, 0.13, 0.13);
  const gray = rgb(0.4, 0.4, 0.4);

  let y = 800;
  const line = (text: string, size = 12, f = font, color = black) => {
    page.drawText(text, { x: 50, y, size, font: f, color });
    y -= size + 8;
  };
  const gap = (n: number) => { y -= n; };

  line(BRAND.name, 22, bold, primary);
  line(tipo.toUpperCase(), 14, bold);
  gap(6);

  const id = datos?.id ?? datos?.factura_id ?? "-";
  line(`Numero / ID: #${id}`);
  line(`Cliente: ${datos?.cliente_nombre ?? datos?.nombre ?? datos?.cliente_id ?? "-"}`);
  if (datos?.empresa) line(`Empresa: ${datos.empresa}`);
  if (datos?.email) line(`Email: ${datos.email}`);
  if (datos?.telefono) line(`Telefono: ${datos.telefono}`);
  line(`Estado: ${datos?.estado ?? "-"}`);
  line(`Fecha: ${fmtDate(datos?.fecha_emision ?? datos?.fecha_inicio ?? datos?.fechaInicio ?? datos?.created_at)}`);
  gap(8);
  const total = datos?.total ?? datos?.valor ?? datos?.monto;
  if (total !== undefined && total !== null) line(`Total: ${fmtMoney(total)}`, 16, bold, primary);
  if (datos?.descripcion) {
    gap(8);
    line("Descripcion:", 11, bold, gray);
    const words = String(datos.descripcion).split(" ");
    let acc = "";
    for (const w of words) {
      if ((acc + " " + w).trim().length > 80) { line(acc.trim(), 11, font, gray); acc = w; }
      else acc += " " + w;
    }
    if (acc.trim()) line(acc.trim(), 11, font, gray);
  }
  gap(10);
  line("Generado por CRM DESEO DIGITAL", 9, font, gray);
  line(new Date().toISOString(), 8, font, gray);

  return await pdf.save();
}

export const PDFGenerator = {
  async factura(datos: any) { return buildPdf("factura", datos); },
  async cotizacion(datos: any) { return buildPdf("cotizacion", datos); },
  async contrato(datos: any) { return buildPdf("contrato", datos); },
  async propuesta(datos: any) { return buildPdf("propuesta", datos); },
} as const;
