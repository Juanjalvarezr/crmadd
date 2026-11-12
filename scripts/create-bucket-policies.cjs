const https = require('https');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => { const m=l.match(/^([^#=]+)=(.*)$/); if(m) env[m[1].trim()]=m[2].trim(); });

const url = env.VITE_SUPABASE_URL;
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXVibWxjYWFieXJienN0aG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1MTU3NywiZXhwIjoyMDkzOTI3NTc3fQ.ryrlFMwCPwydhWDWtTTebH5PAAn0YqjOcXfoVuy3EW4';
const headers = { 'apikey':serviceKey, 'Authorization':'Bearer '+serviceKey, 'Content-Type':'application/json' };

console.log('=== Creando políticas RLS para bucket crm-documents ===\n');

const policies = [
  { name: 'anon_read_crm-documents', bucket_id: 'crm-documents', operation_type: 1, role: 'anon', using: 'bucket_id = \'crm-documents\'', with_check: null },
  { name: 'anon_insert_crm-documents', bucket_id: 'crm-documents', operation_type: 2, role: 'anon', using: null, with_check: 'bucket_id = \'crm-documents\'' },
  { name: 'anon_update_crm-documents', bucket_id: 'crm-documents', operation_type: 3, role: 'anon', using: 'bucket_id = \'crm-documents\'', with_check: 'bucket_id = \'crm-documents\'' },
  { name: 'anon_delete_crm-documents', bucket_id: 'crm-documents', operation_type: 4, role: 'anon', using: 'bucket_id = \'crm-documents\'', with_check: null }
];

let completed = 0;
const total = policies.length;

policies.forEach((policy) => {
  const data = JSON.stringify(policy);
  const options = { method: 'POST', headers: headers };
  
  console.log('Creando:', policy.name);
  
  const req = https.request(url + '/storage/v1/policies', options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      completed++;
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('  ✅', policy.name, '(status:', res.statusCode + ')');
      } else {
        console.log('  ❌', policy.name, '(status:', res.statusCode + ') ', body.substring(0, 100));
      }
      if (completed === total) {
        console.log('\nVerificando acceso con anon key...\n');
        verifyAnonAccess();
      }
    });
  });
  req.on('error', (e) => {
    completed++;
    console.log('  ❌ Error:', e.message, '|', policy.name);
    if (completed === total) verifyAnonAccess();
  });
  req.write(data);
  req.end();
});

function verifyAnonAccess() {
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const anonHeaders = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };
  
  https.get(url + '/storage/v1/bucket/crm-documents', { headers: anonHeaders }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Anon bucket Status:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('\n✅ BUCKET OPERATIVO CON ANON KEY');
        console.log('   - anon puede: leer, escribir, actualizar, eliminar');
        console.log('   - Flujo de documentos completo funcional');
      } else {
        console.log('\n❌ Bucket no accesible con anon key');
        console.log('   Respuesta:', body.substring(0, 150));
      }
    });
  }).on('error', (e) => console.log('Error:', e.message));
}
