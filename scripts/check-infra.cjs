const https = require('https');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => { const m=l.match(/^([^#=]+)=(.*)$/); if(m) env[m[1].trim()]=m[2].trim(); });

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXVibWxjYWFieXJienN0aG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1MTU3NywiZXhwIjoyMDkzOTI3NTc3fQ.ryrlFMwCPwydhWDWtTTebH5PAAn0YqjOcXfoVuy3EW4';

const anonH = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };
const svcH = { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' };

console.log('=== 1. BUCKET + STORAGE ===\n');

// a) Bucket con anon
https.get(url + '/storage/v1/bucket/crm-documents', { headers: anonH }, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    const ok = res.statusCode === 200;
    console.log('a) Bucket (anon):', ok ? '✅ ACCEDIBLE' : '❌ NO accesible (' + res.statusCode + ')');
    if (ok) {
      try { const b=JSON.parse(d); console.log('   ID:', b.id, '| Public:', b.public); } catch(e){}
    }
    storageList();
  });
}).on('error', (e) => { console.log('a) Error:', e.message); storageList(); });

function storageList() {
  https.get(url + '/storage/v1/bucket', { headers: anonH }, (res) => {
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      const ok = res.statusCode === 200;
      console.log('b) Storage list (anon):', ok ? '✅' : '❌ (' + res.statusCode + ')');
      if (ok) {
        try {
          const buckets = JSON.parse(d);
          console.log('   Total buckets:', buckets.length);
          buckets.slice(0,5).forEach(b => console.log('   -', b.id, '| public:', b.public));
        } catch(e){ console.log('   ⚠️ Parse error'); }
      }
      tables();
    });
  }).on('error', (e) => { console.log('b) Error:', e.message); tables(); });
}

function tables() {
  Promise.all([
    req('clientes?limit=1', 'Clientes'),
    req('proyectos?limit=1', 'Proyectos'),
    req('documentos?limit=1', 'Documentos')
  ]).then(() => {
    console.log('\n=== 2. BUCKET CON SERVICE ROLE ===');
    https.get(url + '/storage/v1/bucket/crm-documents', { headers: svcH }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        const ok = res.statusCode === 200;
        console.log('c) Bucket (service_role):', ok ? '✅ existe' : '❌ (' + res.statusCode + ')');
        if (ok) {
          try { const b=JSON.parse(d); console.log('   Fecha creación:', b.created_at); } catch(e){}
        }
        policies();
      });
    }).on('error', (e) => { console.log('c) Error:', e.message); policies(); });
  });
}

function req(endpoint, name) {
  return new Promise((resolve) => {
    https.get(url + '/rest/v1/' + endpoint, { headers: anonH }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        const ok = res.statusCode === 200;
        console.log('  ' + name + ':', ok ? '✅ OK' : '❌ (' + res.statusCode + ')');
        if (!ok) console.log('     ' + d.substring(0,80));
        resolve();
      });
    }).on('error', (e) => { console.log('  ' + name + ': Error:', e.message); resolve(); });
  });
}

function policies() {
  console.log('\n=== 3. POLÍTICAS RLS DEL BUCKET ===');
  https.get(url + '/rest/v1/storage.policies?bucket_id=eq.crm-documents', { headers: svcH }, (res) => {
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      const ok = res.statusCode === 200;
      console.log('d) Políticas (service_role):', ok ? '✅' : '❌ (' + res.statusCode + ')');
      if (ok) {
        try {
          const policies = JSON.parse(d);
          if (policies.length > 0) {
            console.log('   Total:', policies.length);
            policies.forEach(p => console.log('   -', p.name, '| op:', p.operation_type, '| rol:', p.role));
          } else {
            console.log('   ⚠️ Sin políticas explícitas');
          }
        } catch(e){ console.log('   ⚠️ Parse error:', d.substring(0,80)); }
      }
    });
  }).on('error', (e) => { console.log('d) Error:', e.message); });
}
