const https = require('https');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => { const m=l.match(/^([^#=]+)=(.*)$/); if(m) env[m[1].trim()]=m[2].trim(); });

const url = env.VITE_SUPABASE_URL;
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXVibWxjYWFieXJienN0aG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1MTU3NywiZXhwIjoyMDkzOTI3NTc3fQ.ryrlFMwCPwydhWDWtTTebH5PAAn0YqjOcXfoVuy3EW4';
const headers = { 'apikey':serviceKey, 'Authorization':'Bearer '+serviceKey };

console.log('Verificando bucket + políticas...\n');

// Verificar bucket existe
https.get(url + '/storage/v1/bucket/crm-documents', {headers}, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    console.log('Bucket Status:', res.statusCode);
    if(res.statusCode === 200){
      console.log('✅ Bucket crm-documents existe\n');
      // Verificar políticas
      const query = encodeURIComponent('bucket_id=eq.crm-documents');
      https.get(url + '/rest/v1/storage.policies?' + query, {headers}, (res2) => {
        let d2=''; res2.on('data',c=>d2+=c); res2.on('end',()=>{
          console.log('Storage Policies Status:', res2.statusCode);
          try {
            const policies = JSON.parse(d2);
            if(Array.isArray(policies) && policies.length > 0){
              console.log('Políticas:', policies.length);
              policies.forEach(p => console.log('  -', p.name, '| op:', p.operation_type, '| rol:', p.role));
            } else {
              console.log('⚠️ Sin políticas');
            }
          } catch(e){ console.log('Parse error:', d2.substring(0,150)); }
        });
      }).on('error', e=>console.log('Error policies:', e.message));
    } else {
      console.log('❌ Bucket no existe');
    }
  });
}).on('error', e=>console.log('Error bucket:', e.message));
