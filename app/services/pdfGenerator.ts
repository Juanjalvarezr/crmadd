// Generador de PDFs - stubs para cuando se integre una librería real
export const PDFGenerator = {
  async factura(datos: any) {
    throw new Error('Generación de PDF de factura no implementada aún');
  },
  async cotizacion(datos: any) {
    throw new Error('Generación de PDF de cotización no implementada aún');
  },
  async contrato(datos: any) {
    throw new Error('Generación de PDF de contrato no implementada aún');
  },
  async propuesta(datos: any) {
    throw new Error('Generación de PDF de propuesta no implementada aún');
  },
} as const;
