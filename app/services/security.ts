import DOMPurify from 'dompurify';

/**
 * Servicio centralizado de seguridad para validación y sanitización
 */

/**
 * Sanitiza texto para prevenir ataques XSS
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitiza HTML permitiendo solo etiquetas seguras
 */
export const sanitizeHTML = (html: string, allowedTags: string[] = []): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [],
  });
};

/**
 * Valida formato de email con regex avanzado
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email es requerido' };
  }

  // Regex mejorado para validación de email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  // Verificar longitud máxima
  if (email.length > 254) {
    return { valid: false, error: 'Email demasiado largo' };
  }

  // Verificar que el dominio tenga al menos un punto
  const domain = email.split('@')[1];
  if (!domain || !domain.includes('.')) {
    return { valid: false, error: 'Dominio de email inválido' };
  }

  return { valid: true };
};

/**
 * Valida número de teléfono colombiano
 */
export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: false, error: 'Teléfono es requerido' };
  }

  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Verificar formato colombiano (10 dígitos o +57 seguido de 10 dígitos)
  const phoneRegex = /^(\+57)?[0-9]{10}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: 'Formato de teléfono inválido (debe tener 10 dígitos)' };
  }

  return { valid: true };
};

/**
 * Valida URL
 */
export const validateURL = (url: string): { valid: boolean; error?: string } => {
  if (!url) {
    return { valid: false, error: 'URL es requerida' };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'URL inválida' };
  }
};

/**
 * Sanitiza y valida datos de formulario
 */
export const sanitizeFormData = (formData: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      // Si el campo parece ser HTML, sanitizar con etiquetas permitidas
      if (value.includes('<')) {
        sanitized[key] = sanitizeHTML(value, ['b', 'i', 'u', 'strong', 'em', 'p', 'br']);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Valida datos de cliente
 */
export const validateClienteData = (data: any): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validar nombre
  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.nombre = 'Nombre debe tener al menos 2 caracteres';
  }

  // Validar email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || 'Email inválido';
  }

  // Validar teléfono
  if (data.telefono) {
    const phoneValidation = validatePhone(data.telefono);
    if (!phoneValidation.valid) {
      errors.telefono = phoneValidation.error || 'Teléfono inválido';
    }
  }

  // Sanitizar campos de texto
  if (data.dolores) data.dolores = sanitizeText(data.dolores);
  if (data.necesidades) data.necesidades = sanitizeText(data.necesidades);
  if (data.intereses) data.intereses = sanitizeText(data.intereses);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Valida datos de proyecto
 */
export const validateProyectoData = (data: any): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validar nombre
  if (!data.nombre || data.nombre.trim().length < 3) {
    errors.nombre = 'Nombre debe tener al menos 3 caracteres';
  }

  // Validar descripción
  if (!data.descripcion || data.descripcion.trim().length < 10) {
    errors.descripcion = 'Descripción debe tener al menos 10 caracteres';
  }

  // Validar presupuesto
  if (data.presupuesto && (isNaN(data.presupuesto) || data.presupuesto < 0)) {
    errors.presupuesto = 'Presupuesto debe ser un número positivo';
  }

  // Sanitizar campos de texto
  if (data.descripcion) data.descripcion = sanitizeText(data.descripcion);
  if (data.nombre) data.nombre = sanitizeText(data.nombre);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Valida datos de tarea
 */
export const validateTareaData = (data: any): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validar título
  if (!data.titulo || data.titulo.trim().length < 2) {
    errors.titulo = 'Título debe tener al menos 2 caracteres';
  }

  // Validar fecha
  if (!data.fecha) {
    errors.fecha = 'Fecha es requerida';
  } else {
    const fecha = new Date(data.fecha);
    if (isNaN(fecha.getTime())) {
      errors.fecha = 'Fecha inválida';
    }
  }

  // Sanitizar campos de texto
  if (data.titulo) data.titulo = sanitizeText(data.titulo);
  if (data.descripcion) data.descripcion = sanitizeText(data.descripcion);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Escapa caracteres especiales para prevenir SQL injection
 * Nota: Supabase ya maneja esto, pero esta función es una capa adicional de seguridad
 */
export const escapeSQL = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
};

/**
 * Genera un token CSRF seguro
 */
export const generateCSRFToken = (): string => {
  return crypto.randomUUID();
};

/**
 * Valida token CSRF
 */
export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken;
};

/**
 * Verifica si una contraseña es fuerte
 */
export const validatePasswordStrength = (password: string): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (password.length >= 12 && errors.length <= 1) {
    strength = 'medium';
  }
  if (password.length >= 16 && errors.length === 0) {
    strength = 'strong';
  }

  return {
    valid: errors.length === 0,
    strength,
    errors,
  };
};

/**
 * Hashea datos sensibles (para logging, no para almacenamiento)
 */
export const hashSensitiveData = (data: string): string => {
  // Simple hash para no exponer datos sensibles en logs
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};
