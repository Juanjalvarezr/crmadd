// Plantillas base con variables para WhatsApp / Email.
// Uso: renderPlantilla('propuesta', { nombre: 'Juan', servicio: 'SEO', doc_url: '...' })
export interface Plantilla {
  tipo: string;
  nombre: string;
  categoria: string;
  cuerpo: string;
  variables: string[];
}

export const PLANTILLAS: Plantilla[] = [
  {
    tipo: 'propuesta',
    nombre: 'Propuesta comercial',
    categoria: 'ventas',
    variables: ['nombre', 'servicio', 'agente', 'doc_url'],
    cuerpo:
      'Hola {nombre}, soy {agente} de DESEO DIGITAL. ' +
      'Preparamos una propuesta para {servicio}. Te adjuntamos el documento: {doc_url}\n\n' +
      'Quedo atento/a a tus comentarios para avanzar.',
  },
  {
    tipo: 'cotizacion',
    nombre: 'Cotización',
    categoria: 'ventas',
    variables: ['nombre', 'servicio', 'monto', 'doc_url'],
    cuerpo:
      'Hola {nombre}, de DESEO DIGITAL te compartimos la cotización de {servicio} por {monto}. Documento: {doc_url}\n\n' +
      'Quedamos atentos para ajustar lo que necesites.',
  },
  {
    tipo: 'factura',
    nombre: 'Factura',
    categoria: 'facturacion',
    variables: ['nombre', 'monto', 'fecha', 'doc_url'],
    cuerpo:
      'Hola {nombre}, de DESEO DIGITAL te enviamos la factura por {monto} con vencimiento {fecha}. Documento: {doc_url}\n\n' +
      'Gracias por tu confianza.',
  },
  {
    tipo: 'saludo',
    nombre: 'Saludo / bienvenida',
    categoria: 'atencion',
    variables: ['nombre', 'servicio', 'agente'],
    cuerpo:
      'Hola {nombre}, soy {agente} de DESEO DIGITAL. ' +
      'Gracias por tu interés en {servicio}. Ya estamos revisando tu solicitud y te respondemos con una propuesta en breve.',
  },
  {
    tipo: 'seguimiento',
    nombre: 'Seguimiento',
    categoria: 'atencion',
    variables: ['nombre', 'servicio'],
    cuerpo:
      'Hola {nombre}, te saluda DESEO DIGITAL. ' +
      'Quería saber si pudiste revisar la propuesta de {servicio}. ' +
      'Si tenés alguna duda, acá estoy para ayudarte.',
  },
  {
    tipo: 'recordatorio_pago',
    nombre: 'Recordatorio de pago',
    categoria: 'facturacion',
    variables: ['nombre', 'monto', 'fecha'],
    cuerpo:
      'Hola {nombre}, te recordamos amablemente que tienes un pago pendiente de {monto} con vencimiento {fecha}. ' +
      'Si ya lo pagaste, ignorá este mensaje. ¡Gracias!',
  },
];

export function renderPlantilla(tipo: string, datos: Record<string, any>): string {
  const p = PLANTILLAS.find((x) => x.tipo === tipo);
  if (!p) return '';
  return p.cuerpo.replace(/\{(\w+)\}/g, (_, k) => {
    const v = datos[k];
    return v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : '';
  });
}

export function variablesDe(tipo: string): string[] {
  return PLANTILLAS.find((x) => x.tipo === tipo)?.variables ?? [];
}
