const fs = require('fs');
const https = require('https');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('=== Crear bucket crm-documents ===\n');

const data = JSON.stringify({
  id: 'crm-documents',
  name: 'crm-documents',
  public: false,
  allowed_mime_types: ['text/html', 'application/pdf', 'image/png', 'image/jpeg']
});

const options = {
  method: 'POST',
  headers: {
    'apikey': anonKey,
    'Authorization': 'Bearer ' + anonKey,
    'Content-Type': 'application/json'
  }
};

const req = https.request(supabaseUrl + '/storage/v1/bucket', options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body.substring(0, 600));
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ Bucket creado exitosamente');
    } else {
      console.log('\n❌ No se pudo crear el bucket');
      console.log('Necesitas ejecutar el SQL en el editor de Supabase:');
      console.log('  sql/create_bucket_crm_documents.sql');
    }
  });
});

req.on('error', (e) => {
  console.log('Error de conexión:', e.message);
  console.log('\n❌ No se pudo conectar a Supabase');
});

req.write(data);
req.end();
