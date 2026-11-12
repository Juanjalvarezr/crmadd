const https = require('https');
const fs = require('fs');
const env = {};
const envPath = '.env';
const envData = fs.readFileSync(envPath, 'utf8');
envData.split('\n').forEach(l => { const m=l.match(/^([^#=]+)=(.*)$/); if(m) env[m[1].trim()]=m[2].trim(); });

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const anonH = { 'apikey':anonKey, 'Authorization':'Bearer '+anonKey, 'Content-Type':'application/json' };

console.log('=== FLUJO COMPLETO DE DOCUMENTOS ===\n');

// 1. Bucket existe y es accesible
https.get(`${url}/storage/v1/bucket/crm-documents`, { headers:anonH }, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    const ok = res.statusCode === 200;
    console.log('1. Bucket crm-documents:', ok ? '✅ EXISTE Y ACCESIBLE' : '❌ (' + res.statusCode + ')');
    if (!ok) { console.log('   Respuesta:', d.substring(0,150)); return; }
    
    // 2. Subir archivo de prueba
    const fileName = 'crm-documents/prueba-' + Date.now() + '.html';
    const html = '<h1>Documento de prueba</h1><p>Generado ' + new Date().toISOString() + '</p>';
    const data = Buffer.from(html);
    console.log('\n2. Subiendo archivo:', fileName);
    
    const req = https.request(
      `${url}/storage/v1/object/${encodeURIComponent(fileName)}`,
      { method:'POST', headers:{ ...anonH, 'Content-Type':'text/html' } },
      (res2) => {
        let d2=''; res2.on('data',c=>d2+=c); res2.on('end',()=>{
          const uploadOk = res2.statusCode === 200 || res2.statusCode === 201;
          console.log('   Upload:', uploadOk ? '✅ EXITOSO' : '❌ (' + res2.statusCode + ')');
          if (!uploadOk) { console.log('   Respuesta:', d2.substring(0,150)); return; }
          getSignedUrl(fileName);
        });
      }
    );
    req.on('error', (e) => { console.log('   ❌ Error:', e.message); });
    req.write(data); req.end();
  });
}).on('error', (e) => { console.log('1. ❌ Error:', e.message); });

function getSignedUrl(fileName) {
  console.log('\n3. Obteniendo signed URL...');
  const data = JSON.stringify({ bucket:'crm-documents', path:fileName, expiresIn:3600 });
  const req = https.request(
    `${url}/storage/v1/sign/crm-documents/${encodeURIComponent(fileName)}`,
    { method:'POST', headers: anonH },
    (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        try {
          const s = JSON.parse(d);
          const signedUrl = s.signedUrl || s.url;
          const ok = !!signedUrl;
          console.log('   Signed URL:', ok ? '✅ OBTENIDA' : '❌');
          if (ok) {
            console.log('   URL:', signedUrl.substring(0, 120) + '...');
            verifyUrl(signedUrl);
          }
        } catch(e) { console.log('   ❌ Parse error:', d.substring(0,100)); }
      });
    }
  );
  req.on('error', (e) => { console.log('   ❌ Error:', e.message); });
  req.write(data); req.end();
}

function verifyUrl(signedUrl) {
  https.get(signedUrl, (res) => {
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      const ok = res.statusCode === 200;
      console.log('\n4. Acceso al archivo:', ok ? '✅ ACCESIBLE' : '❌ (status ' + res.statusCode + ')');
      if (ok) insertDocumento(signedUrl, d);
    });
  }).on('error', (e) => { console.log('4. ❌ Error:', e.message); });
}

function insertDocumento(signedUrl, content) {
  console.log('\n5. Insertando registro en tabla documentos...');
  const docData = JSON.stringify([{
    titulo:'Documento de prueba - ' + new Date().toISOString().substring(0,10),
    tipo:'factura',
    url:signedUrl,
    descripcion:'Generado automáticamente para verificar flujo completo',
    proyecto_id:'PRY-CRM-001',
    cliente_id:62,
    factura_id:null,
    entidad_tipo:'proyecto',
    entidad_id:'PRY-CRM-001',
    usuario:'Juan José'
  }]);
  
  const req = https.request(`${url}/rest/v1/documentos`, {
    method:'POST',
    headers:{ ...anonH }
  }, (res) => {
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      const ok = res.statusCode === 201 || res.statusCode === 200;
      console.log('   Insert:', ok ? '✅ REGISTRO CREADO' : '❌ (' + res.statusCode + ')');
      if (!ok) { console.log('   Respuesta:', d.substring(0,200)); return; }
      
      // Verificar que se insertó
      const req2 = https.get(`${url}/rest/v1/documentos?limit=1&order=desc`, { headers: anonH }, (res2) => {
        let d2=''; res2.on('data',c=>d2+=c); res2.on('end',()=>{
          try {
            const docs = JSON.parse(d2);
            if (docs.length > 0) {
              const last = docs[0];
              console.log('\n╔══════════════════════════════════════╗');
              console.log('║  FLUJO COMPLETO DE DOCUMENTOS ✅    ║');
              console.log('╠══════════════════════════════════════╣');
              console.log('║  1. ✅ Bucket crm-documents OK       ║');
              console.log('║  2. ✅ Upload de archivo HTML OK     ║');
              console.log('║  3. ✅ Signed URL funciona           ║');
              console.log('║  4. ✅ Registro en tabla documentos  ║');
              console.log('╚══════════════════════════════════════╝');
              console.log('\nDocumento registrado:');
              console.log('  Título:', last.titulo);
              console.log('  Tipo:', last.tipo);
              console.log('  URL:', last.url.substring(0, 80) + '...');
              console.log('  Proyecto:', last.proyecto_id);
              console.log('  Cliente:', last.cliente_id);
            }
          } catch(e) { console.log('   ⚠️ Error verificando:', d2.substring(0,100)); }
        });
      });
      req2.on('error', (e) => { console.log('   ❌ Error verificando:', e.message); });
    });
  });
  req.on('error', (e) => { console.log('   ❌ Error:', e.message); });
  req.write(docData); req.end();
}
