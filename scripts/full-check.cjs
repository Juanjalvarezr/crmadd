const https = require('https');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => { const m=l.match(/^([^#=]+)=(.*)$/); if(m) env[m[1].trim()]=m[2].trim(); });

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXVibWxjYWFieXJienN0aG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1MTU3NywiZXhwIjoyMDkzOTI3NTc3fQ.ryrlFMwCPwydhWDWtTTebH5PAAn0YqjOcXfoVuy3EW4';
const geminiKey = env.VITE_GEMINI_API_KEY;
const resendKey = env.VITE_RESEND_API_KEY;

const anonHeaders = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };
const serviceHeaders = { 'apikey': serviceKey, 'Authorization': 'Beacon ' + serviceKey, 'Content-Type': 'application/json' };
const serviceHeaders2 = { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' };

let checks = 0;
let total = 9;

function done() { checks++; if (checks === total) finish(); }

console.log('=== ESTADO REAL DEL CRM ===\n');
console.log('Proyecto Supabase: fumubmlcaabyrbzsthmt');
console.log('URL: ' + url);
console.log('');

// 1. Bucket con anon key
console.log('1. Bucket crm-documents (anon key)');
https.get(url + '/storage/v1/bucket/crm-documents', { headers: anonHeaders }, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    if (res.statusCode === 200) {
      console.log('   ✅ Bucket ACCEDIBLE (anon)');
      try { const b=JSON.parse(d); console.log('      ID:', b.id, '| Public:', b.public); } catch(e){}
    } else {
      console.log('   ❌ Bucket NO accesible (status:', res.statusCode + ')');
    }
    done();
  });
}).on('error', (e) => { console.log('   ❌ Error:', e.message); done(); });

// 2. Storage list con anon
console.log('2. Storage list (anon)');
https.get(url + '/storage/v1/bucket', { headers: anonHeaders }, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    if (res.statusCode === 200) {
      try {
        const buckets = JSON.parse(d);
        console.log('   ✅ Storage list OK - buckets:', buckets.length);
        if (buckets.length > 0) buckets.forEach(b => console.log('      -', b.id));
      } catch(e) { console.log('   ⚠️ Error parse:', d.substring(0,80)); }
    } else {
      console.log('   ❌ Error:', res.statusCode);
    }
    done();
  });
}).on('error', (e) => { console.log('   ❌ Error:', e.message); done(); });

// 3. Tables con anon
console.log('3. Tablas principales (anon)');
Promise.all([
  new Promise((resolve) => {
    https.get(url + '/rest/v1/clientes?limit=1', { headers: anonHeaders }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        try { const data=JSON.parse(d); resolve({table:'clientes', count:Array.isArray(data)?data.length:0, status:res.statusCode}); }
        catch(e) { resolve({table:'clientes', count:0, status:res.statusCode, error:d.substring(0,80)}); }
      });
    }).on('error',()=>resolve({table:'clientes', count:0, status:0, error:'timeout'}));
  }),
  new Promise((resolve) => {
    https.get(url + '/rest/v1/proyectos?limit=1', { headers: anonHeaders }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        try { const data=JSON.parse(d); resolve({table:'proyectos', count:Array.isArray(data)?data.length:0, status:res.statusCode}); }
        catch(e) { resolve({table:'proyectos', count:0, status:res.statusCode, error:d.substring(0,80)}); }
      });
    }).on('error',()=>resolve({table:'proyectos', count:0, status:0, error:'timeout'}));
  }),
  new Promise((resolve) => {
    https.get(url + '/rest/v1/documentos?limit=1', { headers: anonHeaders }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        try { const data=JSON.parse(d); resolve({table:'documentos', count:Array.isArray(data)?data.length:0, status:res.statusCode}); }
        catch(e) { resolve({table:'documentos', count:0, status:res.statusCode, error:d.substring(0,80)}); }
      });
    }).on('error',()=>resolve({table:'documentos', count:0, status:0, error:'timeout'}));
  })
]).then((results) => {
  results.forEach(r => {
    if (r.status === 200) {
      console.log(`   ✅ ${r.table}: ${r.count} registros accesibles`);
    } else {
      console.log(`   ❌ ${r.table}: ${r.error || 'status '+r.status}`);
    }
  });
  done();
});

// 4. Bucket con service_role
console.log('4. Bucket crm-documents (service_role)');
https.get(url + '/storage/v1/bucket/crm-documents', { headers: serviceHeaders2 }, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    if (res.statusCode === 200) {
      console.log('   ✅ Bucket existe (service_role)');
      try { const b=JSON.parse(d); console.log('      Fecha creación:', b.created_at); } catch(e){}
    } else {
      console.log('   ❌ Service role no puede ver bucket');
    }
    done();
  });
}).on('error', (e) => { console.log('   ❌ Error:', e.message); done(); });

// 5. Políticas de bucket con service_role
console.log('5. Políticas RLS del bucket (service_role)');
https.get(url + '/rest/v1/storage.policies?bucket_id=eq.crm-documents', { headers: serviceHeaders2 }, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    if (res.statusCode === 200) {
      try {
        const policies = JSON.parse(d);
        if (policies.length > 0) {
          console.log('   ✅ Políticas encontradas:', policies.length);
          policies.forEach(p => console.log('      -', p.name, '| op:', p.operation_type, '| rol:', p.role));
        } else {
          console.log('   ⚠️ No hay políticas explícitas');
        }
      } catch(e) { console.log('   ⚠️ Error parse:', d.substring(0,80)); }
    } else {
      console.log('   ❌ Error:', res.statusCode);
    }
    done();
  });
}).on('error', (e) => { console.log('   ❌ Error:', e.message); done(); });

// 6. Gemini
console.log('6. Gemini API (AI)');
if (geminiKey && geminiKey.length > 30) {
  const geminiData = JSON.stringify({ contents: [{ parts: [{ text: 'Test' }] }] });
  const geminiOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': geminiKey }
  };
  const geminiReq = https.request(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiKey,
    geminiOptions,
    (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        if (res.statusCode === 200) {
          console.log('   ✅ Gemini operativo');
        } else {
          console.log('   ❌ Gemini no funciona (status:', res.statusCode, ')');
        }
        done();
      });
    }
  );
  geminiReq.on('error', (e) => { console.log('   ❌ Error:', e.message); done(); });
  geminiReq.write(geminiData);
  geminiReq.end();
} else {
  console.log('   ⚠️ Gemini key no configurada o truncada');
  done();
}

// 7. Resend
console.log('7. Resend API (email)');
if (resendKey) {
  const resendOptions = { method: 'POST', headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' } };
  const resendData = JSON.stringify({ from: 'test@deseodigital.com', to: ['test@deseodigital.com'], subject: 'Test', html: '<p>Test</p>' });
  const resendReq = https.request('https://api.resend.com/emails', resendOptions, (res) => {
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('   ✅ Resend operativo (email enviado)');
      } else if (res.statusCode === 401) {
        console.log('   ❌ Resend key inválida');
      } else {
        console.log('   ⚠️ Resend status:', res.statusCode, '|', d.substring(0,100));
      }
      done();
    });
  });
  resendReq.on('error', (e) => { console.log('   ❌ Error:', e.message); done(); });
  resendReq.write(resendData);
  resendReq.end();
} else {
  console.log('   ⚠️ Resend key no configurada');
  done();
}

// 8. Production URL
console.log('8. Producción (HTTPS)');
https.get('https://crm-agencia-swart.vercel.app/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    console.log('   Status:', res.statusCode);
    if (res.statusCode === 200) {
      const titleMatch = d.match(/<title>([^<]+)<\/title>/);
      console.log('   Título:', titleMatch ? titleMatch[1] : 'sin título');
      console.log('   ✅ App responds (200)');
      if (titleMatch && titleMatch[1] === 'Loading...') {
        console.log('      ⚠️ Pero muestra "Loading..." (SPA sin SSR)');
      }
    } else {
      console.log('   ❌ Error:', res.statusCode);
    }
    done();
  });
}).on('error', (e) => { console.log('   ❌ Error:', e.message); done(); });

// 9. Manifest producción
console.log('9. Manifest rutas (producción)');
https.get('https://crm-agencia-swart.vercel.app/assets/manifest-73758520.js', (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    if (res.statusCode === 200) {
      const routes = d.match(/"routes\/[^"]+"/g) || [];
      console.log(`   ✅ Manifest OK - ${routes.length} rutas registradas`);
      routes.slice(0, 10).forEach(r => console.log('      -', r.replace('"','').replace('"','')));
      if (routes.length > 10) console.log(`      ... +${routes.length - 10} más`);
    } else {
      console.log('   ❌ Manifest no encontrado (status:', res.statusCode, ')');
    }
    done();
  });
}).on('error', (e) => { console.log('   ❌ Error:', e.message); done(); });

function finish() {
  console.log('\n=== RESUMEN ===');
  console.log('Si el bucket sigue en 404 con anon key → las políticas RLS no se crearon correctamente');
  console.log('Solución: ejecutar SQL en Supabase SQL Editor (sql/create_bucket_crm_documents.sql)');
  console.log('O usar service_role key para crear políticas vía API');
}
