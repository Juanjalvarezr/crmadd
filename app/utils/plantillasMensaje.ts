// Plantillas de mensaje por sector para contacto inicial
// Se usa para prefijar el mensaje al abrir WhatsApp

export type Sector = 'hotel' | 'restaurante' | 'comercio' | 'servicio' | 'profesional' | 'otros';

export const placeholders = {
  nombre_hotel: '[nombre del hotel]',
  nombre_negocio: '[nombre del negocio]',
  ciudad: '[ciudad]',
};

export const plantillasMensaje: Record<Sector, { titulo: string; texto: string }> = {
  hotel: {
    titulo: 'Hotel / Alojamiento',
    texto: `Hola, soy Juan de DESEO DIGITAL. Vi que ${placeholders.nombre_hotel} está en ${placeholders.ciudad} y nos interesa ayudarte con publicidad física en tu zona o marketing digital para llenar más habitaciones. ¿Te envío una propuesta rápida con 2 opciones sin compromiso?`,
  },
  restaurante: {
    titulo: 'Restaurante / Comida',
    texto: `Hola, soy Juan de DESEO DIGITAL. Vi que ${placeholders.nombre_negocio} en ${placeholders.ciudad} y nos interesa ayudarte con publicidad física en la zona o marketing digital para que más gente te conozca. ¿Te envío una propuesta rápida con 2 opciones sin compromiso?`,
  },
  comercio: {
    titulo: 'Comercio / Retail',
    texto: `Hola, soy Juan de DESEO DIGITAL. Vi que ${placeholders.nombre_negocio} en ${placeholders.ciudad} y nos interesa ayudarte con publicidad física o marketing digital para atraer más clientes. ¿Te envío una propuesta rápida con 2 opciones sin compromiso?`,
  },
  servicio: {
    titulo: 'Servicio / Profesional',
    texto: `Hola, soy Juan de DESEO DIGITAL. Vi que ${placeholders.nombre_negocio} en ${placeholders.ciudad} y nos interesa ayudarte con publicidad física o marketing digital para encontrar más clientes. ¿Te envío una propuesta rápida con 2 opciones sin compromiso?`,
  },
  profesional: {
    titulo: 'Profesional / Consultoría',
    texto: `Hola, soy Juan de DESEO DIGITAL. Vi que ${placeholders.nombre_negocio} en ${placeholders.ciudad} y nos interesa ayudarte con publicidad física o marketing digital para posicionarte mejor. ¿Te envío una propuesta rápida con 2 opciones sin compromiso?`,
  },
  otros: {
    titulo: 'Negocio / Empresa',
    texto: `Hola, soy Juan de DESEO DIGITAL. Vi que ${placeholders.nombre_negocio} en ${placeholders.ciudad} y nos interesa ayudarte con publicidad física o marketing digital para crecer. ¿Te envío una propuesta rápida con 2 opciones sin compromiso?`,
  },
};

// Detecta sector aproximado a partir del nombre/descripción
export function detectarSector(nombre: string, tipo_negocio?: string): Sector {
  const txt = (nombre + ' ' + (tipo_negocio || '')).toLowerCase();
  if (txt.includes('hotel') || txt.includes('alojamiento') || txt.includes('hostel') || txt.includes('hospedaje') || txt.includes('posada')) return 'hotel';
  if (txt.includes('restaurante') || txt.includes('comida') || txt.includes('cafeteria') || txt.includes('cafe') || txt.includes('comedor')) return 'restaurante';
  if (txt.includes('tienda') || txt.includes(' boutique') || txt.includes('comercio') || txt.includes('market') || txt.includes('mall') || txt.includes('supermercado')) return 'comercio';
  if (txt.includes('servicio') || txt.includes('reparacion') || txt.includes('mantenimiento') || txt.includes('plomero') || txt.includes('electricista')) return 'servicio';
  if (txt.includes('consultor') || txt.includes('abogado') || txt.includes('dentista') || txt.includes('medico') || txt.includes('profesor')) return 'profesional';
  return 'otros';
}
