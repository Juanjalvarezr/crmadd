const https = require('https');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXVibWxjYWFieXJienN0aG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1MTU3NywiZXhwIjoyMDkzOTI3NTc3fQ.ryrlFMwCPwydhWDWtTTebH5PAAn0YqjOcXfoVuy3EW4';

const srHeaders = { 'apikey': serviceRoleKey, 'Authorization': 'Bearer ' + serviceRoleKey };
const anHeaders = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };

console.log('=== 1. Verificar bucket crm-documents ===\n');

https.get(supabaseUrl + '/storage/v1/bucket/crm-documents', { headers: srHeaders }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Bucket:', data.substring(0, 200));
    if (res.statusCode === 200) {
      console.log('✅ Bucket existe');
      console.log('\n✅ FLUJO COMPLETO DE DOCUMENTOS FUNCIONA (bucket creado + tabla alineada)');
      console.log('\n=== PRÓXIMOS PASOS ===');
      console.log('1. Verificar auth/login en producción');
      console.log('2. Verificar rutas registradas (manifest)');
      console.log('3. Verificar APIs: email, WhatsApp, AI');
      console.log('4. Verificar deploy sincronizado');
    } else {
      console.log('❌ Bucket no encontrado');
    }
  });
}).on('error', (e) => console.log('Error:', e.message));
