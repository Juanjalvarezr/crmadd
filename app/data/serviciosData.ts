// Servicios DESEO DIGITAL - Catálogo completo
export interface ServicioSEO {
  id: number;
  nombre: string;
  categoria: "SEO" | "SEM" | "Social Media" | "Diseño Web" | "Contenido" | "Analytics" | "Automatización" | "E-commerce" | "Publicidad Física";
  descripcion: string;
  precioBase: number;
  duracion: string; // ej: "1 mes", "3 meses"
  incluye: string[];
  estado: "Activo" | "Inactivo";
  popularidad: number; // 1-5 estrellas
}

export const mockServicios: ServicioSEO[] = [
  {
    id: 1,
    nombre: "SEO On-Page Optimización",
    categoria: "SEO",
    descripcion: "Optimización técnica de tu sitio web para motores de búsqueda. Incluye meta tags, velocidad, estructura URL.",
    precioBase: 800000,
    duracion: "1 mes",
    incluye: [
      "Auditoría técnica completa",
      "Optimización de meta tags",
      "Mejora de velocidad de carga",
      "Optimización de imágenes",
      "Estructura de URLs SEO-friendly",
      "Implementación schema markup"
    ],
    estado: "Activo",
    popularidad: 5
  },
  {
    id: 2,
    nombre: "SEO Off-Page - Link Building",
    categoria: "SEO",
    descripcion: "Estrategia de construcción de enlaces de calidad para mejorar autoridad de dominio.",
    precioBase: 1200000,
    duracion: "3 meses",
    incluye: [
      "Análisis de backlinks competencia",
      "Estrategia de link building",
      "Guest posting en blogs relevantes",
      "Creación de perfiles en directorios",
      "Link baiting content",
      "Reporte mensual de enlaces obtenidos"
    ],
    estado: "Activo",
    popularidad: 4
  },
  {
    id: 3,
    nombre: "Google Ads - SEM",
    categoria: "SEM",
    descripcion: "Gestión profesional de campañas publicitarias en Google Ads para maximizar ROI.",
    precioBase: 600000,
    duracion: "Mensual",
    incluye: [
      "Creación de campañas optimizadas",
      "Investigación de keywords",
      "Segmentación avanzada",
      "A/B testing de anuncios",
      "Optimización diaria de pujas",
      "Reporte semanal de resultados"
    ],
    estado: "Activo",
    popularidad: 5
  },
  {
    id: 4,
    nombre: "Gestión Redes Sociales",
    categoria: "Social Media",
    descripcion: "Administración profesional de perfiles sociales con contenido estratégico.",
    precioBase: 900000,
    duracion: "Mensual",
    incluye: [
      "3-5 publicaciones semanales",
      "Diseño gráfico de posts",
      "Gestión de 3 redes sociales",
      "Interacción con comunidad",
      "Reporte de métricas",
      "Calendario editorial mensual"
    ],
    estado: "Activo",
    popularidad: 5
  },
  {
    id: 5,
    nombre: "Landing Page Estratégica",
    categoria: "Diseño Web",
    descripcion: "Creación de sitio web 'llave en mano'. Código en GitHub, despliegue en Vercel. Pago único.",
    precioBase: 1200000,
    duracion: "2 semanas",
    incluye: [
      "Diseño UX/UI personalizado",
      "Desarrollo responsive",
      "Despliegue en Vercel",
      "Optimización de carga",
      "Capacitación de confirmación final"
    ],
    estado: "Activo",
    popularidad: 4
  },
  {
    id: 6,
    nombre: "Marketing de Contenidos",
    categoria: "Contenido",
    descripcion: "Creación de contenido estratégico: blogs, ebooks, infografías para atraer clientes.",
    precioBase: 700000,
    duracion: "Mensual",
    incluye: [
      "4 artículos de blog SEO",
      "1 ebook o guía mensual",
      "2 infografías",
      "Keyword research",
      "Optimización on-page",
      "Promoción en redes sociales"
    ],
    estado: "Activo",
    popularidad: 4
  },
  {
    id: 7,
    nombre: "Google Analytics 4 Setup",
    categoria: "Analytics",
    descripcion: "Configuración avanzada de Analytics con eventos personalizados y reportes.",
    precioBase: 500000,
    duracion: "1 mes",
    incluye: [
      "Migración a GA4",
      "Configuración de eventos",
      "Creación de dashboards",
      "Goals y conversiones",
      "Integración Search Console",
      "Capacitación de interpretación"
    ],
    estado: "Activo",
    popularidad: 3
  },
  {
    id: 8,
    nombre: "SEO Local - Google My Business",
    categoria: "SEO",
    descripcion: "Optimización para búsquedas locales y posicionamiento en Google Maps.",
    precioBase: 600000,
    duracion: "2 meses",
    incluye: [
      "Optimización Google My Business",
      "Citas en directorios locales",
      "Gestión de reseñas",
      "SEO local on-page",
      "Schema markup local",
      "Reporte de ranking local"
    ],
    estado: "Activo",
    popularidad: 4
  },
  {
    id: 13,
    nombre: "Pack Presencia Digital Elite (360°)",
    categoria: "Social Media",
    descripcion: "Gestión total: Google Business, FB, IG, TikTok, YouTube, Web (Vercel) y Tiendanube. Incluye 4 Reels/mes y 5 historias diarias.",
    precioBase: 2000000,
    duracion: "Mensual (Suscripción)",
    incluye: [
      "Web personalizada (Vercel/GitHub)",
      "Google Business Setup",
      "4 Reels editados al mes",
      "5 Historias diarias (L-V)",
      "Gestión de canales digitales",
      "Tiendanube / E-commerce básico"
    ],
    estado: "Activo",
    popularidad: 5
  },
  {
    id: 9,
    nombre: "Agentes de IA con n8n",
    categoria: "Automatización",
    descripcion: "Creación de flujos de trabajo inteligentes y bots que ahorran tiempo y dinero.",
    precioBase: 1500000,
    duracion: "1 mes",
    incluye: ["Configuración n8n", "Integración con OpenAI/Gemini", "Automatización de CRM", "Bots de WhatsApp"],
    estado: "Activo",
    popularidad: 5
  },
  {
    id: 10,
    nombre: "E-commerce: Dropi + Tienda Nube",
    categoria: "E-commerce",
    descripcion: "Montaje completo de tienda con sistema de dropshipping integrado.",
    precioBase: 2000000,
    duracion: "1-2 meses",
    incluye: ["Diseño de tienda", "Vinculación Dropi", "Configuración de pagos", "Carga de 50 productos"],
    estado: "Activo",
    popularidad: 4
  },
  {
    id: 11,
    nombre: "Pack Audiovisual: Reels y Videos",
    categoria: "Contenido",
    descripcion: "Producción de contenido dinámico para redes sociales.",
    precioBase: 1200000,
    duracion: "Mensual",
    incluye: ["Guion estratégico", "Grabación", "Edición profesional", "Música con licencia"],
    estado: "Activo",
    popularidad: 5
  },
  {
    id: 12,
    nombre: "Publicidad Física (Terceros)",
    categoria: "Publicidad Física",
    descripcion: "Producción de pendones, volantes y material P.O.P. vía proveedores externos.",
    precioBase: 100000, // Precio base de gestión
    duracion: "1 semana",
    incluye: ["Diseño estratégico", "Gestión de proveedor", "Control de calidad", "Logística de entrega"],
    estado: "Activo",
    popularidad: 3
  }
];

// Categorías de servicios
export const categoriasServicio = [
  { value: "all", label: "Todas las Categorías" },
  { value: "SEO", label: "SEO (Posicionamiento)" },
  { value: "SEM", label: "SEM (Publicidad)" },
  { value: "Social Media", label: "Redes Sociales" },
  { value: "Diseño Web", label: "Diseño Web" },
  { value: "Contenido", label: "Marketing de Contenidos" },
  { value: "Analytics", label: "Analytics y Datos" },
  { value: "Automatización", label: "Automatización e IA" },
  { value: "E-commerce", label: "E-commerce y Drop" },
  { value: "Publicidad Física", label: "Publicidad Física" }
];

// Función para formatear precio en pesos colombianos
export const formatCOP = (valor: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
};
