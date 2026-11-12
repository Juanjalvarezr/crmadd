// Verificar las keys reales en runtime
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer .env
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

console.log('=== VITE_SUPABASE_ANON_KEY ===');
console.log('Longitud:', env.VITE_SUPABASE_ANON_KEY?.length);
console.log('Primeros 50:', env.VITE_SUPABASE_ANON_KEY?.substring(0, 50));
console.log('Últimos 20:', env.VITE_SUPABASE_ANON_KEY?.substring(env.VITE_SUPABASE_ANON_KEY?.length - 20));

console.log('\n=== VITE_GEMINI_API_KEY ===');
console.log('Longitud:', env.VITE_GEMINI_API_KEY?.length);
console.log('Primeros 50:', env.VITE_GEMINI_API_KEY?.substring(0, 50));

console.log('\n=== VITE_RESEND_API_KEY ===');
console.log('Longitud:', env.VITE_RESEND_API_KEY?.length);
console.log('Primeros 50:', env.VITE_RESEND_API_KEY?.substring(0, 50));

console.log('\n=== Verificar si las keys son JWT válidos ===');
// Una clave JWT de Supabase tiene 3 partes separadas por puntos
const anonKey = env.VITE_SUPABASE_ANON_KEY || '';
const partes = anonKey.split('.');
console.log('Anon key tiene 3 partes (JWT):', partes.length === 3);
if (partes.length === 3) {
  console.log('Header (decodificado):', Buffer.from(partes[0], 'base64').toString('utf8'));
  console.log('Payload (decodificado):', Buffer.from(partes[1], 'base64').toString('utf8'));
}

console.log('\n=== Crear cliente Supabase ===');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
console.log('Cliente creado OK');

// Probar conexión
supabase.from('documentos').select('*').limit(1).then(({ data, error }) => {
  console.log('\n=== Tabla documentos ===');
  if (error) console.log('❌ Error:', error.message);
  else console.log('✅ OK - registros:', data?.length);
}).catch(e => console.log('❌ Exception:', e.message));
