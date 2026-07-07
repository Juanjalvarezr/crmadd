export interface Plantilla {
  id: string;
  nombre: string;
  tipo: 'factura' | 'contrato';
  contenido: string;
  variables: string[];
  creado_en: string;
  actualizado_en: string;
}

const STORAGE_KEY = 'crm_plantillas';

export function getPlantillas(): Plantilla[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlantilla(plantilla: Omit<Plantilla, 'id' | 'creado_en' | 'actualizado_en'>): Plantilla {
  const plantas = getPlantillas();
  const now = new Date().toISOString();
  const nueva: Plantilla = {
    ...plantilla,
    id: `plant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    creado_en: now,
    actualizado_en: now,
  };
  plantas.push(nueva);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantas));
  return nueva;
}

export function updatePlantilla(id: string, cambios: Partial<Omit<Plantilla, 'id' | 'creado_en' | 'actualizado_en'>>): Plantilla | null {
  const plantas = getPlantillas();
  const idx = plantas.findIndex(p => p.id === id);
  if (idx === -1) return null;
  plantas[idx] = { ...plantas[idx], ...cambios, actualizado_en: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantas));
  return plantas[idx];
}

export function deletePlantilla(id: string): boolean {
  const plantas = getPlantillas();
  const filtered = plantas.filter(p => p.id !== id);
  if (filtered.length === plantas.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getPlantillasPorTipo(tipo: Plantilla['tipo']): Plantilla[] {
  return getPlantillas().filter(p => p.tipo === tipo);
}

export function aplicarPlantilla(contenido: string, datos: Record<string, string>): string {
  let resultado = contenido;
  Object.entries(datos).forEach(([key, value]) => {
    resultado = resultado.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return resultado;
}

export function extraerVariables(contenido: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const vars = new Set<string>();
  let match;
  while ((match = regex.exec(contenido)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}
