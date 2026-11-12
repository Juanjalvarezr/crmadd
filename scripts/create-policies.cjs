const https = require('https');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => { const m=l.match(/^([^#=]+)=(.*)$/); if(m) env[m[1].trim()]=m[2].trim(); });

const url = env.VITE_SUPABASE_URL;
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXVibWxjYWFieXJienN0aG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1MTU3NywiZXhwIjoyMDkzOTI3NTc3fQ.ryrlFMwCPwydhWDWtTTebH5PAAn0YqjOcXfoVuy3EW4';
const headers = { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' };

console.log('=== Creando políticas RLS para bucket crm-documents ===\n');

// SQL statements para crear las políticas
const policies = [
  `CREATE POLICY "anon_read_crm-documents" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'crm-documents');`,
  `CREATE POLICY "anon_insert_crm-documents" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'crm-documents');`,
  `CREATE POLICY "anon_update_crm-documents" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'crm-documents');`,
  `CREATE POLICY "anon_delete_crm-documents" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'crm-documents');`
];

// Intentar ejecutar SQL directamente mediante el endpoint de Supabase
// Algunos proyectos permiten ejecutar SQL vía /rest/v1/rpc con función especial
// O vía una request POST con el cuerpo SQL

// Primero verificamos si existe la tabla storage.objects
console.log('Verificando existencia de storage.objects...');
https.get(url + '/rest/v1/storage.objects?limit=1', { headers }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('storage.objects Status:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ storage.objects existe');
      // Intentar crear políticas vía múltiples requests
      createPolicies();
    } else {
      console.log('⚠️ storage.objects no accesible directamente');
      console.log('Respuesta:', d.substring(0, 150));
      console.log('\nNecesitas ejecutar SQL manualmente en Supabase SQL Editor:');
      console.log('  sql/create_bucket_crm_documents.sql');
    }
  });
}).on('error', (e) => console.log('Error:', e.message));

function createPolicies() {
  console.log('\nIntentando crear políticas...');
  
  // Usar el endpoint de Supabase que acepta ejecución de SQL
  // En algunos setups, POST /rest/v1/... con el SQL en el body funciona
  // Pero más común es usar la función invoice o un endpoint especial
  
  // Alternativa: usar /rpc para llamar una función que ejecuta SQL
  // Pero necesitamos una función que exista
  
  // Vamos a intentar con el endpoint de "database" directamente
  const sqlStatements = [
    `DROP POLICY IF EXISTS "anon_read_crm-documents" ON storage.objects;`,
    `CREATE POLICY "anon_read_crm-documents" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'crm-documents');`,
    `DROP POLICY IF EXISTS "anon_insert_crm-documents" ON storage.objects;`,
    `CREATE POLICY "anon_insert_crm-documents" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'crm-documents');`,
    `DROP POLICY IF EXISTS "anon_update_crm-documents" ON storage.objects;`,
    `CREATE POLICY "anon_update_crm-documents" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'crm-documents');`,
    `DROP POLICY IF EXISTS "anon_delete_crm-documents" ON storage.objects;`,
    `CREATE POLICY "anon_delete_crm-documents" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'crm-documents');`
  ];
  
  let idx = 0;
  function executeNext() {
    if (idx >= sqlStatements.length) {
      console.log('\n✅ Politicas creadas (si todos los requests fueron 200/201)');
      verifyAnonAccess();
      return;
    }
    const sql = sqlStatements[idx];
    const data = JSON.stringify({ query: sql });
    const options = {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' }
    };
    
    console.log(`Ejecutando (${idx+1}/${sqlStatements.length}): ${sql.substring(0, 60)}...`);
    
    https.request(url + '/rest/v1/rpc/exec_sql', options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        idx++;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('  ✅ OK');
        } else {
          console.log('  ❌ Error (status:', res.statusCode, '):', body.substring(0, 100));
        }
        executeNext();
      });
    }).on('error', (e) => {
      idx++;
      console.log('  ❌ Error de conexión:', e.message);
      executeNext();
    }).write(data);
  }
  
  executeNext();
}

function verifyAnonAccess() {
  console.log('\n=== Verificando acceso con anon key ===');
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const anonHeaders = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };
  
  https.get(url + '/storage/v1/bucket/crm-documents', { headers: anonHeaders }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Anon bucket Status:', res.statusCode);
      if (res.statusCode === 200) {
        try {
          const b = JSON.parse(body);
          console.log('✅ Bucket ACCEDIBLE con anon key');
          console.log('  ID:', b.id, '| Public:', b.public);
        } catch (e) {
          console.log('Bucket existe:', body.substring(0, 100));
        }
      } else {
        console.log('❌ Bucket NO accesible con anon key');
        console.log('  Respuesta:', body.substring(0, 150));
      }
    });
  }).on('error', (e) => console.log('Error:', e.message));
}
