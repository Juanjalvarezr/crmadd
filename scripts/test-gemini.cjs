const https = require('https');
const fs = require('fs');

const env = {};
const envData = fs.readFileSync('.env', 'utf8');
envData.split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const geminiKey = env.VITE_GEMINI_API_KEY;

console.log('=== Probando Gemini con key del .env ===\n');
console.log('Key:', geminiKey);
console.log('Longitud:', geminiKey.length, 'chars');
console.log();

const geminiData = JSON.stringify({
  contents: [{ parts: [{ text: 'Responde solo "OK" si recibes esto.' }] }]
});

const geminiOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': geminiKey
  }
};

const req = https.request(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiKey,
  geminiOptions,
  (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Gemini Status:', res.statusCode);
      if (res.statusCode === 200) {
        try {
          const r = JSON.parse(body);
          const text = r.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
          console.log('✅ Gemini funciona — respuesta:', text.substring(0, 80));
          console.log('\n=== AI Key funciona en CRM ===');
        } catch(e) {
          console.log('✅ Gemini funciona (status 200)');
        }
      } else {
        console.log('❌ Gemini no funciona:', body.substring(0, 300));
        if (res.statusCode === 400 && body.includes('API key not valid')) {
          console.log('\n⚠️ La key del .env está TRUNCADA o INVÁLIDA');
          console.log('Gemini keys válidas tienen ~50+ caracteres.');
          console.log('Debes obtener una key nueva desde: https://aistudio.google.com/apikey');
        }
      }
    });
  }
);
req.on('error', (e) => console.log('Error Gemini:', e.message));
req.write(geminiData);
req.end();
