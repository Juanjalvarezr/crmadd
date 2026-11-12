// Verificar las keys reales en .env
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const content = fs.readFileSync(envPath, 'utf8');

console.log('=== .env file ===');
console.log('Size:', content.length, 'bytes');
console.log('Lines:', content.split('\n').length);

// Parse
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.trim()) {
    const isKey = /^VITE_/.test(line);
    const label = isKey ? 'KEY' : 'comment';
    console.log('Line ' + (i + 1) + ' [' + label + ']: ' + line.length + ' chars');
    if (isKey) {
      const eqIdx = line.indexOf('=');
      const key = line.substring(0, eqIdx);
      const val = line.substring(eqIdx + 1);
      console.log('  ' + key + ': ' + val.length + ' chars');
      console.log('  Preview: ' + val.substring(0, 60));
      console.log('  End: ...' + val.substring(val.length - 10));
    }
  }
});

// Check for literal '...' in values
console.log('\n=== Checking for literal truncation markers ===');
lines.forEach((line, i) => {
  if (line.includes('...')) {
    const m = /^VITE_(\w+)=/.exec(line);
    if (m) {
      const key = m[1];
      const val = line.substring(m[0].length);
      console.log('WARNING: ' + key + ' contains literal ...');
      console.log('  Full value: ' + val);
      console.log('  Real length: ' + val.length + ' chars');
    }
  }
});
