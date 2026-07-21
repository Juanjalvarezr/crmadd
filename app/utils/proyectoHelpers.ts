/**
 * proyectoHelpers.ts
 * Funciones utilitarias compartidas para vistas de proyectos.
 * Fuente única de verdad — evita duplicaciones entre proyecto.tsx,
 * public-proyecto.tsx y proyectos.tsx.
 */

export const getFaseColor = (fase: string): string => {
  const colors: Record<string, string> = {
    propuesta: "#00b0ff",
    contrato: "#9c27b0",
    onboarding: "#ff9100",
    operacion: "#00c853",
    capacitacion: "#00e5ff",
    renovacion: "#e91e63",
  };
  return colors[fase] || "#9e9e9e";
};

export const getFaseLabel = (fase: string): string => {
  const labels: Record<string, string> = {
    propuesta: "Propuesta Comercial",
    contrato: "Contrato Firmado",
    onboarding: "Onboarding y Setup",
    operacion: "Operación Activa",
    capacitacion: "Capacitación",
    renovacion: "Renovación Mensual",
  };
  return labels[fase] || fase;
};

export const getEstadoLabel = (estado: string): string => {
  const labels: Record<string, string> = {
    planificacion: "En Planificación",
    en_progreso: "En Progreso Activo",
    pausado: "En Pausa Temporal",
    completado: "Completado Exitosamente",
    cancelado: "Cancelado",
  };
  return labels[estado] || estado;
};

export const getEstadoColor = (estado: string): string => {
  const colors: Record<string, string> = {
    planificacion: "#90caf9",
    en_progreso: "#ffcc80",
    pausado: "#b39ddb",
    completado: "#a5d6a7",
    cancelado: "#ef9a9a",
  };
  return colors[estado] || "#9e9e9e";
};

/** Genera la URL pública del portal del cliente para un proyecto dado */
export const getPublicProyectoUrl = (proyectoId: string | number): string => {
  return `${window.location.origin}/public/proyecto/${proyectoId}`;
};

/** Copia texto al portapapeles, retorna true si tiene éxito */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para contextos sin API de clipboard
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  }
};
