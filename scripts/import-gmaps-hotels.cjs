#!/usr/bin/env node
/**
 * Importar hoteles de Villavicencio desde CSV de Presto Map
 * al CRM DESEO DIGITAL (tabla clientes de Supabase)
 * 
 * Uso: node scripts/import-gmaps-hotels.cjs
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eqIdx = trimmed.indexOf('=');
      const key = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ruta del CSV
const csvPath = path.join(__dirname, '..', 'gmaps_1789738986554.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`❌ CSV no encontrado en: ${csvPath}`);
  process.exit(1);
}

// Leer y parsear CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim());

if (lines.length < 2) {
  console.error('❌ CSV vacío o sin datos');
  process.exit(1);
}

const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
const dataLines = lines.slice(1).filter(l => l.trim() && !l.includes('Presto Map Scraper'));

console.log(`📊 CSV encontrado: ${csvPath}`);
console.log(`📋 Headers: ${headers.join(', ')}`);
console.log(`📈 Registros válidos: ${dataLines.length}`);

// Parsear cada línea CSV (manejo simple de comillas)
function parseCSVLine(line) {
  const result = {};
  let current = '';
  let inQuotes = false;
  let fieldIndex = 0;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result[headers[fieldIndex]] = current.trim().replace(/^"|"$/g, '');
      current = '';
      fieldIndex++;
    } else {
      current += char;
    }
  }
  result[headers[fieldIndex]] = current.trim().replace(/^"|"$/g, '');
  return result;
}

// Transformar registro CSV → formato CRM
function transformHotelRecord(record) {
  // Limpiar teléfono (quitar espacios, dar formato +57)
  const phoneRaw = (record.phone_number || '').trim();
  const phone = phoneRaw ? `+57${phoneRaw.replace(/\s/g, '')}` : '';
  
  // Determinar nicho desde primary_category
  const nicho = record.primary_category || 'Hotel';
  
  // Dirección
  const direccion = record.fulladdr || '';
  
  // Rating y reviews para identidad_digital
  const rating = parseFloat(record.rating) || null;
  const reviews = parseInt(record.reviews) || 0;
  
  return {
    nombre: record.name || 'Sin nombre',
    empresa: record.name || '', // Para hoteles, nombre = empresa
    telefono: phone,
    email: '',
    nicho: nicho,
    origen: 'Presto Map - Google Maps',
    estado: 'Nuevo Lead',
    ultima_interaccion: 'Importación automática',
    created_at: new Date().toISOString(),
    favorito: false,
    codigo: `GMAP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    identidad_digital: JSON.stringify({
      fuente: 'Google Maps via Presto Map',
      url_perfil: record.url || '',
      direccion: direccion,
      rating: rating,
      reseñas: reviews,
      categoria_principal: record.primary_category || '',
      coordenadas: {
        lat: parseFloat(record.latitude) || null,
        lng: parseFloat(record.longitude) || null,
      },
      importado_en: new Date().toISOString(),
    }),
  };
}

// Procesar todos los registros
const registros = dataLines.map(parseCSVLine).map(transformHotelRecord);

console.log('\n📝 Primeros 3 registros a importar:');
registros.slice(0, 3).forEach((r, i) => {
  console.log(`   ${i + 1}. ${r.nombre} | ${r.telefono} | ${r.nicho} | Rating: ${JSON.parse(r.identidad_digital).rating || 'N/A'}`);
});

// Verificar duplicados por nombre+teléfono
async function getExistingClients() {
  const { data, error } = await supabase
    .from('clientes')
    .select('nombre, telefono, origen')
    .eq('origen', 'Presto Map - Google Maps');
  
  if (error) {
    console.error('❌ Error al consultar clientes existentes:', error.message);
    return [];
  }
  
  const existing = new Map();
  (data || []).forEach(c => {
    const key = `${c.nombre}|${c.telefono}`;
    existing.set(key, true);
  });
  
  return data || [];
}

// Insertar registros
async function importarRegistros(registros) {
  const existing = await getExistingClients();
  const existingKeys = new Set(
    existing.map(c => `${c.nombre}|${c.telefono}`)
  );
  
  const toInsert = [];
  const skipped = [];
  
  registros.forEach(r => {
    const key = `${r.nombre}|${r.telefono}`;
    if (existingKeys.has(key)) {
      skipped.push(r.nombre);
    } else {
      toInsert.push(r);
    }
  });
  
  console.log(`\n🔍 Verificación de duplicados:`);
  console.log(`   Total: ${registros.length}`);
  console.log(`   Duplicados (saltados): ${skipped.length}`);
  console.log(`   Nuevos a insertar: ${toInsert.length}`);
  
  if (skipped.length > 0) {
    console.log(`   Saltados: ${skipped.join(', ')}`);
  }
  
  if (toInsert.length === 0) {
    console.log('\n✅ No hay nuevos registros para importar.');
    return;
  }
  
  // Insertar en batches de 10
  const batchSize = 10;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { data, error } = await supabase.from('clientes').insert(batch);
    
    if (error) {
      console.error(`❌ Error en batch ${i / batchSize + 1}:`, error.message);
      errors++;
    } else {
      inserted += (data ? data.length : 0);
      console.log(`   ✅ Batch ${i / batchSize + 1}: ${batch.length} insertados`);
    }
  }
  
  console.log(`\n📊 RESULTADO FINAL:`);
  console.log(`   ✅ Insertados: ${inserted}`);
  console.log(`   ⚠️  Errores: ${errors}`);
  console.log(`   ⏭️  Saltados (duplicados): ${skipped.length}`);
  
  if (errors === 0 && inserted > 0) {
    console.log('\n🎉 ¡Importación completada con éxito!');
  }
}

// Ejecutar
importarRegistros(registros).catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
