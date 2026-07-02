// Mock de datos para funcionamiento offline/demo
// Estos datos se usan cuando Supabase no está disponible

export const mockClientes = [
  {
    id: 1,
    nombre: "Empresa Tech Solutions",
    email: "contact@techsolutions.com",
    telefono: "+57-300-1234567",
    empresa: "Tech Solutions SAS",
    nicho: "Tecnología",
    origen: "Referido",
    dolores: "No tienen presencia digital",
    necesidades: "Sitio web profesional",
    intereses: "Desarrollo web, SEO",
    estado: "Activo" as const,
    ultimaInteraccion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    nombre: "Ecommerce Premium",
    email: "info@ecommercepremium.com",
    telefono: "+57-300-7654321",
    empresa: "Premium Ecommerce LTDA",
    nicho: "E-commerce",
    origen: "Ads",
    dolores: "Bajas ventas online",
    necesidades: "Optimizar conversión",
    intereses: "Marketing digital, CRO",
    estado: "Activo" as const,
    ultimaInteraccion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockOportunidades = [
  {
    id: 1,
    nombre: "Sitio web Tech Solutions",
    clienteId: 1,
    clienteNombre: "Empresa Tech Solutions",
    valor: 3500000,
    serviciosInteres: ["Desarrollo web", "SEO"],
    etapa: "Propuesta" as const,
    probabilidad: 75,
    fechaCierre: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notas: "Cliente muy interesado, reunión confirmada",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    nombre: "Consultoría Marketing Digital",
    clienteId: 2,
    clienteNombre: "Ecommerce Premium",
    valor: 2000000,
    serviciosInteres: ["Marketing digital"],
    etapa: "Prospección" as const,
    probabilidad: 45,
    fechaCierre: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    notas: "Pendiente de cotización",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockTareas = [
  {
    id: 1,
    titulo: "Llamar a Tech Solutions",
    descripcion: "Confirmar reunión para siguiente semana",
    prioridad: "Alta" as const,
    estado: "Pendiente" as const,
    clienteId: 1,
    clienteNombre: "Empresa Tech Solutions",
    fechaVencimiento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: "Tarea",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    titulo: "Preparar propuesta para Ecommerce",
    descripcion: "Crear presupuesto detallado",
    prioridad: "Media" as const,
    estado: "En progreso" as const,
    clienteId: 2,
    clienteNombre: "Ecommerce Premium",
    fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: "Tarea",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockProyectos = [
  {
    id: 1,
    nombre: "Rediseño Portal Tech Solutions",
    clienteId: 1,
    descripcion: "Rediseño completo del portal web",
    estado: "en_progreso" as const,
    presupuesto: 3500000,
    gastado: 1200000,
    fechaInicio: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    fechaFin: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    equipo: ["Juan Carlos", "María López"],
    tareas: [
      { id: 1, titulo: "Análisis de requisitos", completada: true },
      { id: 2, titulo: "Diseño de mockups", completada: true },
      { id: 3, titulo: "Desarrollo frontend", completada: false },
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    actualizadoEn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockServicios = [
  {
    id: 1,
    nombre: "Diseño Web Profesional",
    categoria: "Diseño",
    descripcion: "Diseño moderno y responsivo",
    precio: 2000000,
    duracion: "4 semanas",
    popularidad: 95,
  },
  {
    id: 2,
    nombre: "Desarrollo Full Stack",
    categoria: "Desarrollo",
    descripcion: "Desarrollo completo de aplicaciones",
    precio: 5000000,
    duracion: "8 semanas",
    popularidad: 100,
  },
  {
    id: 3,
    nombre: "SEO Optimization",
    categoria: "Marketing",
    descripcion: "Posicionamiento en buscadores",
    precio: 1500000,
    duracion: "3 meses",
    popularidad: 85,
  },
];
