const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_ANON_KEY = keyMatch[1];

const url = new URL(SUPABASE_URL + '/rest/v1/clientes?select=*&limit=1');
const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
  }
};

const start = Date.now();
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Time:', Date.now() - start, 'ms');
    console.log('Body:', data.slice(0, 500));
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.end();
