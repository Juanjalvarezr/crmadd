// RBAC básico CRM: admin (todo) / editor (crear/editar) / viewer (lectura)
// Rol desde Supabase user_metadata.rol (valores legacy: Admin/Vendedor/Manager/Soporte).
import { supabase } from "../services/supabase";

export type Rol = "admin" | "editor" | "viewer";

const SENSITIVE_PATHS = ["/facturacion", "/contratos", "/configuracion"];

export function normalizeRol(raw: any): Rol {
  const r = String(raw || "").toLowerCase().trim();
  if (r === "admin" || r === "administrador") return "admin";
  if (r === "editor" || r === "vendedor" || r === "manager" || r === "gerente") return "editor";
  return "viewer";
}

export function isSensitive(path: string) {
  return SENSITIVE_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

export function can(rol: Rol, action: "read" | "write" | "admin"): boolean {
  if (action === "read") return true;
  if (action === "write") return rol === "admin" || rol === "editor";
  return rol === "admin";
}

export async function getCurrentRol(): Promise<Rol> {
  const { data } = await supabase.auth.getUser();
  const meta: any = data?.user?.user_metadata ?? {};
  return normalizeRol(meta.rol ?? meta.role);
}
