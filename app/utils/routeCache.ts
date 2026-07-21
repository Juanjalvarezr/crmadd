import { clientesService, proyectosService, tareasService, oportunidadesService, transaccionesService, serviciosService } from '../services/database';
import { facturasService, contratosService } from '../services/facturacion';
import { documentosService } from '../services/supabase';

const CACHE_KEY = 'crm_route_cache_v1';
const CACHE_TTL = 5 * 60 * 1000;

type CacheEntry<T> = { data: T; timestamp: number };

const memoryCache = new Map<string, CacheEntry<any>>();

function getStored(key: string): CacheEntry<any> | undefined {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CacheEntry<any>;
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_KEY}_${key}`);
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function setStored(key: string, data: any) {
  try {
    localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

export async function getCachedProjects() {
  const key = 'proyectos';
  const cached = getStored(key) || memoryCache.get(key);
  if (cached) return cached.data as any[];
  const data = await proyectosService.getAll().catch(() => []);
  memoryCache.set(key, { data, timestamp: Date.now() });
  setStored(key, data);
  return data;
}

export async function getCachedClients() {
  const key = 'clientes';
  const cached = getStored(key) || memoryCache.get(key);
  if (cached) return cached.data as any[];
  const data = await clientesService.getAll().catch(() => []);
  memoryCache.set(key, { data, timestamp: Date.now() });
  setStored(key, data);
  return data;
}

export async function getCachedTasks() {
  const key = 'tareas';
  const cached = getStored(key) || memoryCache.get(key);
  if (cached) return cached.data as any[];
  const data = await tareasService.getAll().catch(() => []);
  memoryCache.set(key, { data, timestamp: Date.now() });
  setStored(key, data);
  return data;
}

export async function getCachedInvoices() {
  const key = 'facturas';
  const cached = getStored(key) || memoryCache.get(key);
  if (cached) return cached.data as any[];
  const data = await facturasService.getAll().catch(() => []);
  memoryCache.set(key, { data, timestamp: Date.now() });
  setStored(key, data);
  return data;
}

export async function getCachedContracts() {
  const key = 'contratos';
  const cached = getStored(key) || memoryCache.get(key);
  if (cached) return cached.data as any[];
  const data = await contratosService.getAll().catch(() => []);
  memoryCache.set(key, { data, timestamp: Date.now() });
  setStored(key, data);
  return data;
}

export async function getCachedDocuments() {
  const key = 'documentos';
  const cached = getStored(key) || memoryCache.get(key);
  if (cached) return cached.data as any[];
  const data = await documentosService.getAll().catch(() => []);
  memoryCache.set(key, { data, timestamp: Date.now() });
  setStored(key, data);
  return data;
}

export async function getCachedTransactions() {
  const key = 'transacciones';
  const cached = getStored(key) || memoryCache.get(key);
  if (cached) return cached.data as any[];
  const data = await transaccionesService.getAll().catch(() => []);
  memoryCache.set(key, { data, timestamp: Date.now() });
  setStored(key, data);
  return data;
}

export async function getCachedServices() {
  const key = 'servicios';
  const cached = getStored(key) || memoryCache.get(key);
  if (cached) return cached.data as any[];
  const data = await serviciosService.getAll().catch(() => []);
  memoryCache.set(key, { data, timestamp: Date.now() });
  setStored(key, data);
  return data;
}

export const invalidateCache = (key?: string) => {
  if (key) {
    memoryCache.delete(key);
    localStorage.removeItem(`${CACHE_KEY}_${key}`);
  } else {
    memoryCache.clear();
    Object.keys(localStorage).forEach(k => { if (k.startsWith(CACHE_KEY)) localStorage.removeItem(k); });
  }
};
