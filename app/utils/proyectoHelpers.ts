/**
 * proyectoHelpers.ts
 * Funciones utilitarias compartidas para vistas de proyectos.
 * Fuente única de verdad — evita duplicaciones entre proyecto.tsx,
 * public-proyecto.tsx y proyectos.tsx.
 */

import crypto from 'node:crypto';

/**
 * Genera token firmado para acceso público a un proyecto
 */
export function generatePublicAccessToken(proyectoId: string | number, expiresInDays = 30): string {
  const secret = import.meta.env.VITE_PUBLIC_LINK_SECRET || 'deseo-digital-public-link-secret';
  const payload = `${proyectoId}:${Date.now() + expiresInDays * 24 * 60 * 60 * 1000}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}:${signature}`;
}

/**
 * Valida token y retorna proyectoId si es válido
 */
export function validatePublicAccessToken(token: string): string | null {
  try {
    const [proyectoId, expires, signature] = token.split(':');
    const secret = import.meta.env.VITE_PUBLIC_LINK_SECRET || 'deseo-digital-public-link-secret';
    const expected = crypto.createHmac('sha256', secret).update(`${proyectoId}:${expires}`).digest('hex');
    if (signature !== expected) return null;
    if (Number(expires) < Date.now()) return null;
    return proyectoId;
  } catch {
    return null;
  }
}

/**
 * Genera URL completa del portal público
 */
export function getPublicProyectoUrl(proyectoId: string | number): string {
  const token = generatePublicAccessToken(proyectoId);
  return `${window.location.origin}/public-proyecto/${proyectoId}?token=${token}`;
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  }
}

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

