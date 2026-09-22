export interface CSVRow {
  [key: string]: string;
}

export interface CSVParsed {
  headers: string[];
  rows: CSVRow[];
  funcionales: CSVRow[];
  noFuncionales: CSVRow[];
}

export function parseCSV(text: string): CSVParsed {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [], funcionales: [], noFuncionales: [] };

  const headers = parseLine(lines[0]);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0) continue;
    const row: CSVRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  const funcionales = rows.filter(isFuncional);
  const noFuncionales = rows.filter(r => !isFuncional(r));

  return { headers, rows, funcionales, noFuncionales };
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function isFuncional(row: CSVRow): boolean {
  const telefonos = extractPhones(row);
  const emails = extractEmails(row);
  return telefonos.length > 0 || emails.length > 0;
}

function extractPhones(row: CSVRow): string[] {
  const values = Object.values(row).join(' ');
  const phoneRegex = /[+]?[\s]?[0-9]{7,15}/g;
  const matches = values.match(phoneRegex);
  return matches ? matches.map(p => p.replace(/\s/g, '')) : [];
}

function extractEmails(row: CSVRow): string[] {
  const values = Object.values(row).join(' ');
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = values.match(emailRegex);
  return matches || [];
}

export function detectNombre(row: CSVRow): string {
  const keys = Object.keys(row);
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (lower.includes('name') || lower.includes('nombre') || lower.includes('businessname') || lower.includes('empresa')) {
      const val = row[key]?.trim();
      if (val && val.length > 1) return val;
    }
  }
  for (const key of keys) {
    const val = row[key]?.trim();
    if (val && val.length > 2 && val.length < 80) return val;
  }
  return '';
}

export function detectTelefono(row: CSVRow): string {
  const phones = extractPhones(row);
  return phones[0] || '';
}

export function detectEmail(row: CSVRow): string {
  const emails = extractEmails(row);
  return emails[0] || '';
}

export function detectDireccion(row: CSVRow): string {
  const keys = Object.keys(row);
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (lower.includes('address') || lower.includes('direccion') || lower.includes('addr') || lower.includes('location')) {
      const val = row[key]?.trim();
      if (val && val.length > 3) return val;
    }
  }
  return '';
}

export function detectUbicacion(row: CSVRow): string {
  const keys = Object.keys(row);
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (lower.includes('city') || lower.includes('ciudad') || lower.includes('town') || lower.includes('ubication') || lower.includes('ubicacion')) {
      const val = row[key]?.trim();
      if (val && val.length > 1) return val;
    }
  }
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (lower.includes('addr') || lower.includes('address')) {
      const val = row[key]?.trim();
      if (val && val.length > 3) {
        const parts = val.split(',');
        if (parts.length >= 2) return parts[parts.length - 1].trim();
      }
    }
  }
  return '';
}

export function detectOrigen(row: CSVRow): string {
  const origenKeys = ['google_maps', 'gmaps', 'presto_map', 'maps', 'google'];
  for (const key of origenKeys) {
    if (Object.keys(row).some(k => k.toLowerCase().includes(key))) {
      return 'Presto Map - Google Maps';
    }
  }
  return 'Desconocido';
}

export interface ProspectoFromCSV {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  ubicacion: string;
  origen: string;
  esFuncional: boolean;
}

export function rowToProspectoData(row: CSVRow): ProspectoFromCSV {
  return {
    nombre: detectNombre(row),
    telefono: detectTelefono(row),
    email: detectEmail(row),
    direccion: detectDireccion(row),
    ubicacion: detectUbicacion(row),
    origen: detectOrigen(row),
    esFuncional: isFuncional(row),
  };
}
