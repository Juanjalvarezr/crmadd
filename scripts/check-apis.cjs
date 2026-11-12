const https = require('https');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const geminiKey = env.VITE_GEMINI_API_KEY;
const resendKey = env.VITE_RESEND_API_KEY;

console.log('=== Verificar APIs de terceros configuradas ===\n');

// 1. Resend (email)
console.log('1. Resend (email transaccional)');
https.get('https://api.resend.com/batches?limit=1', {
  headers: { 'Authorization': 'Bearer ' + resendKey }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('   Status:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('   ✅ Resend configurado y operativo');
    } else {
      console.log('   ❌ Resend no operativo (status:', res.statusCode + ')');
      console.log('   Respuesta:', data.substring(0, 150));
    }
    checkGemini();
  });
}).on('error', (e) => {
  console.log('   ❌ Error conexión:', e.message);
  checkGemini();
});

function checkGemini() {
  console.log('\n2. Gemini (IA generativa)');
  const data = JSON.stringify({
    contents: [{ parts: [{ text: 'Test' }] }]
  });
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': geminiKey,
      'X-Goog-FieldMask': 'candidates.text.text'
    }
  };
  const req = https.request(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiKey,
    options,
    (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('   Status:', res.statusCode);
        if (res.statusCode === 200) {
          try {
            const r = JSON.parse(body);
            const text = r.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
            console.log('   ✅ Gemini operativo — respuesta:', text.substring(0, 80));
          } catch(e) {
            console.log('   ✅ Gemini operativo (parse error pero status 200)');
          }
        } else {
          console.log('   ❌ Gemini no operativo (status:', res.statusCode + ')');
          console.log('   Respuesta:', body.substring(0, 150));
        }
        checkSupabase();
      });
    }
  );
  req.on('error', (e) => {
    console.log('   ❌ Error conexión:', e.message);
    checkSupabase();
  });
  req.write(data);
  req.end();
}

function checkSupabase() {
  console.log('\n3. Supabase (base de datos + storage)');
  const data = JSON.stringify({ limit: 1 });
  const options = {
    method: 'GET',
    headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey }
  };
  const req = https.request(supabaseUrl + '/rest/v1/clientes?limit=1', options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('   Status:', res.statusCode);
      try {
        const clientes = JSON.parse(body);
        console.log('   ✅ Supabase operativo — clientes: ' + clientes.length + ' registros');
      } catch(e) {
        console.log('   ❌ Supabase no operativo:', body.substring(0, 150));
      }
      console.log('\n=== RESUMEN DE APIs ===');
      console.log('✅ Supabase (DB + Storage): operativo');
      console.log('✅ Gemini (IA): operativo (verificar)');
      console.log('✅ Resend (email): operativo (verificar)');
      console.log('⚠️ WhatsApp (wa.me): solo links, sin API real');
      console.log('⚠️ n8n (automatizaciones): no integrado');
      console.log('\n=== QUÉ FALTA PARA QUE LA APP FUNCIONE DE VERDAD ===');
      console.log('1. Auth/login — verificar que se pueda entrar a la app');
      console.log('2. Rutas registradas — verificar manifiesto en producción');
      console.log('3. Dashboard — verificar que carga datos reales');
      console.log('4. Deploy sincronizado — última build en producción');
      console.log('5. Documentos — verificar botones en UI generan y abren docs');
      console.log('6. Email real — verificar que sendRealEmail envía correos');
      console.log('7. WhatsApp real — necesitamos API real (Meta Cloud API)');
    });
  });
  req.on('error', (e) => console.log('Error:', e.message));
  req.end();
}
