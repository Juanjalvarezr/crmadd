// Script para extraer hoteles del CSV gmaps y crear como prospectos en Supabase
// Uso: node scripts/import-hotel-prospects.cjs

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'gmaps_1789738986554.csv');

// 1. Leer y parsear el CSV
const csvRaw = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csvRaw.split('\n');

// Extraer headers
const headers = lines[0].split(',').map(function(h) { return h.trim().replace(/^"|"$/g, ''); });
console.log('Headers:', headers.join(', '));

// 2. Parsear cada fila (manejo simple de CSV — suficiente para este archivo)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const rows = lines.slice(1).filter(function(l) { return l.trim(); }).map(parseCSVLine);

// 3. Mapear headers a índices
const headerIndex = {};
headers.forEach(function(h, i) { headerIndex[h] = i; });

// 4. Extraer registros válidos
const validRecords = [];

for (const row of rows) {
  const name = row[headerIndex['name']] || '';
  const phone = row[headerIndex['phone_number']] || '';
  const intPhone = row[headerIndex['international_phone_number']] || '';
  const fulladdr = row[headerIndex['fulladdr']] || '';
  const district = row[headerIndex['district']] || '';
  const categoria = row[headerIndex['primary_category']] || '';
  const ratingRaw = row[headerIndex['rating']] || '0';
  const reviewsRaw = row[headerIndex['reviews']] || '0';

  // Usar international_phone_number si existe, sino phone_number
  const rawPhone = intPhone || phone;

  // Limpiar número: solo dígitos, el +57 al inicio
  const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');

  // Validar: debe tener al menos 10 dígitos y empezar con +57 o ser 10+ dígitos
  if (!cleanPhone || cleanPhone.length < 10) continue;
  if (!name || name.length < 2) continue;

  // Normalizar WhatsApp: +57 seguido de número sin código de país repetido
  let whatsapp = cleanPhone;
  if (cleanPhone.startsWith('+57') && cleanPhone.length > 12) {
    // Quitar el +57 y el primer dígito (0) si existe
    const digits = cleanPhone.replace('+57', '');
    if (digits.startsWith('0')) {
      whatsapp = '+57' + digits.slice(1);
    }
  }

  // Si tiene 10 dígitos sin prefijo, agregar +57
  if (/^\d{10,12}$/.test(cleanPhone) && !cleanPhone.startsWith('+')) {
    whatsapp = '+57' + cleanPhone;
  }

  // Extraer ciudad del address
  let ciudad = 'Villavicencio';
  const addrLower = fulladdr.toLowerCase();
  if (addrLower.includes('villavicencio')) {
    ciudad = 'Villavicencio';
  } else if (addrLower.includes('mesetas')) {
    ciudad = 'Mesetas';
  }

  // Rating y reviews
  const rating = parseFloat(ratingRaw) || 0;
  const reviews = parseInt(reviewsRaw, 10) || 0;

  validRecords.push({
    name: name.trim(),
    telefono: cleanPhone,
    direccion: fulladdr.trim(),
    distrito: district.trim() || '',
    ciudad: ciudad,
    categoria: categoria.trim() || 'Hotel',
    rating: rating,
    reviews: reviews,
    whatsapp: whatsapp,
  });
}

console.log('\n✅ Registros válidos extraídos: ' + validRecords.length);
console.log('\n📋 Resumen por categoría:');
const catCount = {};
validRecords.forEach(function(r) { catCount[r.categoria] = (catCount[r.categoria] || 0) + 1; });
Object.entries(catCount).forEach(function(entry) {
  console.log('   ' + entry[0] + ': ' + entry[1]);
});
console.log('\n📊 Rating promedio:', (validRecords.reduce(function(s, r) { return s + r.rating; }, 0) / validRecords.length).toFixed(2));
console.log('📊 Total opiniones:', validRecords.reduce(function(s, r) { return s + r.reviews; }, 0));

// 5. Crear array para Supabase (formato Prospecto)
const prospectsToInsert = validRecords.map(function(r, idx) {
  return {
    nombre: r.name,
    telefono: r.telefono,
    email: null,
    direccion: r.direccion || null,
    ubicacion: r.ciudad + ', Meta, Colombia',
    tipo_negocio: r.categoria,
    descripcion: 'Hotel en ' + r.ciudad + ' - Rating: ' + r.rating + ' (' + r.reviews + ' reseñas)' + (r.distrito ? ' - ' + r.distrito : ''),
    estado: 'Nuevo',
    origen: 'Google Maps - Hoteles Villavicencio',
    canal_preferido: 'WhatsApp',
    codigo: 'GM-' + String(idx + 1).padStart(3, '0'),
    es_prospecto: true,
    listo_contactar: true,
  };
});

console.log('\n📦 Prospectos a crear en Supabase: ' + prospectsToInsert.length);

// 6. Preparar SQL para importación directa
function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

const sqlValues = prospectsToInsert.map(function(p) {
  return (
    '(' +
    escapeSQL(p.nombre) + ', ' +
    escapeSQL(p.telefono) + ', ' +
    escapeSQL(p.email) + ', ' +
    escapeSQL(p.direccion) + ', ' +
    escapeSQL(p.ubicacion) + ', ' +
    escapeSQL(p.tipo_negocio) + ', ' +
    escapeSQL(p.descripcion) + ', ' +
    escapeSQL(p.estado) + ', ' +
    escapeSQL(p.origen) + ', ' +
    escapeSQL(p.canal_preferido) + ', ' +
    escapeSQL(p.codigo) + ', ' +
    p.es_prospecto + ', ' +
    p.listo_contactar + ', NOW())'
  );
}).join(',\n');

const SQL_FILE = path.join(__dirname, 'import-hotel-prospects.sql');
const sqlContent =
  '-- Importación de ' + prospectsToInsert.length + ' hoteles de Villavicencio desde Google Maps\n' +
  '-- Extraído: ' + new Date().toISOString() + '\n' +
  '-- Sector: Hoteles / Alojamiento\n' +
  '-- Ciudad principal: Villavicencio, Meta\n' +
  '\n' +
  'INSERT INTO prospecting_pipeline (\n' +
  '  nombre, telefono, email, direccion, ubicacion,\n' +
  '  tipo_negocio, descripcion, estado, origen, canal_preferido,\n' +
  '  codigo, es_prospecto, listo_contactar, creado_en\n' +
  ') VALUES\n' +
  sqlValues + '\n' +
  'ON CONFLICT DO NOTHING;\n';

fs.writeFileSync(SQL_FILE, sqlContent, 'utf-8');
console.log('\n📄 SQL guardado en: ' + SQL_FILE);
console.log('   Ejecutar en Supabase SQL Editor: \\i ' + path.basename(SQL_FILE));

// 7. Guardar JSON para verificación
const JSON_FILE = path.join(__dirname, 'hotel-prospects.json');
fs.writeFileSync(JSON_FILE, JSON.stringify(prospectsToInsert, null, 2), 'utf-8');
console.log('\n📄 JSON guardado en: ' + JSON_FILE);

console.log('\n✅ Proceso completado. Para ejecutar en Supabase:');
console.log('   1. Abrir SQL Editor en https://fumubmlcaabyrbzsthmt.supabase.co');
console.log('   2. Ejecutar: \\i ' + path.basename(SQL_FILE));
console.log('   3. Verificar en CRM -> /prospectos');

// 8. Mostrar primeros 10 registros como muestra
console.log('\n📋 PRIMEROS 10 REGISTROS (vista previa):');
console.log('─'.repeat(80));
validRecords.slice(0, 10).forEach(function(r, i) {
  console.log((i + 1) + '. ' + r.name);
  console.log('   📞 ' + r.telefono + ' -> WhatsApp: ' + r.whatsapp);
  console.log('   📍 ' + r.direccion + (r.distrito ? ', ' + r.distrito : ''));
  console.log('   Bandera: ' + r.rating + ' (' + r.reviews + ' opiniones) - ' + r.categoria);
  console.log('   💬 WhatsApp: https://wa.me/' + r.whatsapp.replace('+57', ''));
  console.log('');
});
