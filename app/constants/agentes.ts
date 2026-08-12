
export type RolAgente = 'Director Estratégico' | 'Productor' | 'Diseñador' | 'Edición Audiovisual' | 'SEO/Analítica' | 'Copywriter' | 'Soporte';

export interface PerfilAgente {
  rol: RolAgente;
  descripcion: string;
  skills_sugeridas: string[];
  herramientas_sugeridas: string[];
  modulos_crm: string[];
  max_proyectos: number;
  prompt_sugerido: string;
  icono: string;
}

export const perfilesAgente: Record<RolAgente, PerfilAgente> = {
  'Director Estratégico': {
    rol: 'Director Estratégico',
    descripcion: 'Dueño del proyecto, alinea resultados a objetivos de negocio.',
    skills_sugeridas: ['Estrategia', 'Gestión comercial', 'Presupuestos', 'Onboarding'],
    herramientas_sugeridas: ['Dashboard', 'Ventas', 'Proyectos', 'Tareas'],
    modulos_crm: ['ventas','proyectos','tareas','configuracion','clientes'],
    max_proyectos: 8,
    prompt_sugerido: 'prompt_director_estrategico',
    icono: '🎯'
  },
  'Productor': {
    rol: 'Productor',
    descripcion: 'Opera proyectos de principio a fin y desbloquea riesgos.',
    skills_sugeridas: ['Cronogramas', 'Recursos', 'Proveedores', 'Calidad'],
    herramientas_sugeridas: ['Proyectos', 'Tareas', 'Documentos', 'Calendar'],
    modulos_crm: ['proyectos','tareas','documentos','servicios'],
    max_proyectos: 6,
    prompt_sugerido: 'prompt_productor',
    icono: '🎬'
  },
  'Diseñador': {
    rol: 'Diseñador',
    descripcion: 'Define identidad visual, piezas y experiencia.',
    skills_sugeridas: ['Branding', 'UI/UX', 'Diseño responsive', 'Figma'],
    herramientas_sugeridas: ['Proyectos', 'Documentos', 'Servicios'],
    modulos_crm: ['proyectos','documentos','servicios'],
    max_proyectos: 5,
    prompt_sugerido: 'prompt_disennador',
    icono: '🎨'
  },
  'Edición Audiovisual': {
    rol: 'Edición Audiovisual',
    descripcion: 'Edita reels, historias y piezas audiovisuales.',
    skills_sugeridas: ['Reels', 'Stories', 'Premiere', 'After Effects'],
    herramientas_sugeridas: ['Proyectos', 'Documentos'],
    modulos_crm: ['proyectos','documentos'],
    max_proyectos: 4,
    prompt_sugerido: 'prompt_edicion',
    icono: '🎞️'
  },
  'SEO/Analítica': {
    rol: 'SEO/Analítica',
    descripcion: 'SEO, performance, seguimiento y métricas.',
    skills_sugeridas: ['SEO técnico', 'Analytics', 'GA4', 'Reportes'],
    herramientas_sugeridas: ['Reportes', 'Proyectos', 'Tareas'],
    modulos_crm: ['reportes','proyectos','tareas','clientes'],
    max_proyectos: 6,
    prompt_sugerido: 'prompt_seo',
    icono: '📈'
  },
  'Copywriter': {
    rol: 'Copywriter',
    descripcion: 'Redacción comercial, asuntos, guiones y posicionamiento.',
    skills_sugeridas: ['Copywriting', 'Guiones', 'Email', 'Pautas'],
    herramientas_sugeridas: ['Email', 'Proyectos', 'Documentos'],
    modulos_crm: ['email-marketing','proyectos','documentos','ventas'],
    max_proyectos: 6,
    prompt_sugerido: 'prompt_copywriter',
    icono: '✍️'
  },
  'Soporte': {
    rol: 'Soporte',
    descripcion: 'Soporte, onboarding y atención de clientes.',
    skills_sugeridas: ['Atención', 'Onboarding', 'Incidentes', 'Clientes'],
    herramientas_sugeridas: ['Clientes', 'Tareas', 'Interacciones'],
    modulos_crm: ['clientes','tareas','interacciones'],
    max_proyectos: 10,
    prompt_sugerido: 'prompt_soporte',
    icono: '🛠️'
  }
};

export const modulosCrm = [
  'ventas','proyectos','tareas','clientes','email-marketing','reportes','documentos','configuracion','servicios'
];
