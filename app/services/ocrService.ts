import * as Tesseract from 'tesseract.js';

export interface ExtractedCard {
  nombre?: string;
  empresa?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  redes?: string[];
  texto?: string;
}

const PHONE_PATTERN = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?[\d\s-]{6,15}/g;
const EMAIL_PATTERN = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
const WEB_PATTERN = /(?:https?:\/\/)?(?:www\.)?[-A-Za-z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
const SOCIAL_PATTERN = /(?:instagram|facebook|linkedin|x\.com|twitter|tiktok|youtube)[^\s]*/i;

function clean(arr: string[]) {
  return arr
    .map((v) => v.replace(/[{}()\[\];]/g, '').trim())
    .filter((v) => v.length > 2 && v.length < 120);
}

function extractCardData(text: string): ExtractedCard {
  const phones = clean(text.match(PHONE_PATTERN) || []);
  const emails = clean(text.match(EMAIL_PATTERN) || []);
  const webs = clean(text.match(WEB_PATTERN) || []);
  const redes = clean(text.match(SOCIAL_PATTERN) || []) || [];

  // Heurística simple: primera línea significativa como nombre
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && l.length < 80);

  const nombre = lines.find((l) => !/\d/.test(l) && !l.includes('@') && !l.includes('.')) || undefined;
  const empresa = lines.find((l) => l !== nombre && !/\d/.test(l) && !l.includes('@')) || undefined;

  return {
    nombre,
    empresa,
    telefono: phones[0] || undefined,
    email: emails[0] || undefined,
    direccion: lines.find((l) => /\d/.test(l) && l.length > 12) || undefined,
    redes,
    texto: text,
  };
}

export async function scanCardFromImage(file: File): Promise<ExtractedCard> {
  const worker = await Tesseract.createWorker('spa', 1, {
    logger: () => {},
  });

  const { data } = await worker.recognize(file);
  await worker.terminate();

  return extractCardData((data.text || '').trim());
}
