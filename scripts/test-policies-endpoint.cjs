const https = require('https');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => { const m=l.match(/^([^#=]+)=(.*)$/); if(m) env[m[1].trim()]=m[2].trim(); });

const url = env.VITE_SUPABASE_URL;
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXVibWxjYWFieXJienN0aG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1MTU3NywiZXhwIjoyMDkzOTI3NTc3fQ.ryrlFMwCPwydhWDWtTTebH5PAAn0YqjOcXfoVuy3EW4';
const headers = { 'apikey':serviceKey, 'Authorization':'Bearer '+serviceKey, 'Content-Type':'application/json' };

console.log('=== Buscando endpoint correcto para políticas ===\n');

// Intentar varios endpoints posibles
const endpoints = [
  { method: 'POST', path: '/storage/v1/objects/bucket/crm-documents/policies', name: 'v1/objects/bucket/:id/policies' },
  { method: 'PUT', path: '/storage/v1/objects/bucket/crm-documents/policies', name: 'PUT v1/objects/bucket/:id/policies' },
  { method: 'POST', path: '/storage/v1/bucket/crm-documents/policies', name: 'v1/bucket/:id/policies' },
  { method: 'POST', path: '/storage/v1/policies', name: 'v1/policies' },
  { method: 'PUT', path: '/storage/v1/policies', name: 'PUT v1/policies' },
];

let completed = 0;
const total = endpoints.length;

endpoints.forEach((ep, idx) => {
  const options = { method: ep.method, headers: headers };
  const req = https.request(url + ep.path, options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      completed++;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Funciona:', ep.name, '(status:', res.statusCode + ')');
      } else {
        console.log('❌', ep.name, '(status:', res.statusCode + ')');
      }
      if (completed === total) {
        console.log('\n=== Intentando con la API de db.rpc ===');
        testDbRpc();
      }
    });
  });
  req.on('error', (e) => {
    completed++;
    console.log('❌ Error en', ep.name, ':', e.message);
    if (completed === total) testDbRpc();
  });
  req.write(JSON.stringify({ bucket_id: 'crm-documents', name: 'test-policy' }));
  req.end();
});

function testDbRpc() {
  // Intentar usar rpc para ejecutar SQL
  console.log('\nProbando ejecutar SQL vía rpc...');
  const sql = `CREATE POLICY "anon_read_crm-documents" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'crm-documents');`;
  const data = JSON.stringify({ sql: sql, params: [] });
  const options = { method: 'POST', headers: headers };
  
  const req = https.request(url + '/rpc', options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('RPC Status:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('✅ RPC funciona');
      } else {
        console.log('❌ RPC no funciona:', body.substring(0, 150));
        console.log('\n=== RECOMENDACIÓN ===');
        console.log('Ejecutar en Supabase SQL Editor:');
        console.log('  sql/create_bucket_crm_documents.sql');
      }
    });
  });
  req.on('error', (e) => console.log('RPC Error:', e.message));
  req.write(data);
  req.end();
}
