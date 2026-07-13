export function safeGetStorageItem(key: string, fallback = ""): string {
  if (typeof window === "undefined") return fallback;

  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch (error) {
    console.warn(`[safeStorage] No se pudo leer ${key}:`, error);
    return fallback;
  }
}

export function safeSetStorageItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[safeStorage] No se pudo guardar ${key}:`, error);
    return false;
  }
}

export function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch (error) {
    console.warn(`[safeStorage] JSON inválido en ${key}:`, error);
    return fallback;
  }
}

export function safeWriteJson<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[safeStorage] No se pudo serializar ${key}:`, error);
    return false;
  }
}

export function safeReadJsonArray<T>(key: string, fallback: T[] = []): T[] {
  const parsed = safeReadJson<T[] | null>(key, null);
  if (!Array.isArray(parsed)) {
    return fallback;
  }
  return parsed;
}

export function safeDispatchCustomEvent(name: string, detail?: unknown): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.dispatchEvent(new CustomEvent(name, detail !== undefined ? { detail } : undefined));
    return true;
  } catch (error) {
    console.warn(`[safeStorage] No se pudo disparar ${name}:`, error);
    return false;
  }
}
