const fs = require('fs');
const https = require('https');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('=== Probar upload de documento al bucket ===\n');

const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Prueba Documento</title></head>
<body>
  <h1>Documento de prueba</h1>
  <p>Generado para verificar el flujo completo del CRM.</p>
  <p>Fecha: ${new Date().toISOString()}</p>
</body>
</html>`;

const fileName = `crm-documents/prueba-${Date.now()}.html`;

console.log('Subiendo archivo:', fileName);

const data = Buffer.from(htmlContent);

const uploadOptions = {
  method: 'POST',
  headers: {
    'apikey': anonKey,
    'Authorization': 'Bearer ' + anonKey,
    'Content-Type': 'text/html'
  }
};

const uploadReq = https.request(supabaseUrl + '/storage/v1/object/' + encodeURIComponent(fileName), uploadOptions, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('--- Resultado upload ---');
    console.log('Status:', res.statusCode);
    console.log('Response:', body.substring(0, 300));
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ Archivo subido exitosamente');
      // Obtener signed URL para verificar acceso
      getSignedUrl(fileName);
    } else {
      console.log('\n❌ Upload falló');
      console.log('Necesitas ejecutar sql/create_bucket_crm_documents.sql en Supabase');
    }
  });
});

uploadReq.on('error', (e) => {
  console.log('Error:', e.message);
});

uploadReq.write(data);
uploadReq.end();

function getSignedUrl(fileName) {
  console.log('\n=== Obtener signed URL ===');
  
  const signOptions = {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': 'Bearer ' + anonKey,
      'Content-Type': 'application/json'
    }
  };
  
  const signData = JSON.stringify({
    bucket: 'crm-documents',
    path: fileName,
    expiresIn: 3600
  });
  
  const signReq = https.request(supabaseUrl + '/storage/v1/sign/crm-documents/' + encodeURIComponent(fileName), signOptions, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Signed URL Status:', res.statusCode);
      try {
        const signedData = JSON.parse(body);
        const signedUrl = signedData['signedUrl'] || signedData.url;
        console.log('Signed URL obtenida ✅');
        console.log('URL:', signedUrl.substring(0, 100) + '...');
        
        // Verificar que la signed URL funciona
        verifySignedUrl(signedUrl, fileName);
      } catch(e) {
        console.log('Error parseando respuesta:', body.substring(0, 300));
        console.log('No se pudo obtener signed URL');
      }
    });
  });
  
  signReq.on('error', (e) => console.log('Error obteniendo signed URL:', e.message));
  signReq.write(signData);
  signReq.end();
}

function verifySignedUrl(signedUrl, fileName) {
  https.get(signedUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('\n--- Verificar signed URL ---');
      console.log('Status:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('✅ Archivo accesible vía signed URL');
        insertDocumento(fileName, signedUrl, data);
      } else {
        console.log('❌ Signed URL no funciona (status:', res.statusCode + ')');
      }
    });
  }).on('error', (e) => {
    console.log('Error verificando:', e.message);
  });
}

function insertDocumento(fileName, url, content) {
  const docData = {
    titulo: 'Documento prueba - ' + fileName,
    tipo: 'factura',
    url: url,
    descripcion: 'Documento generado para probar el flujo completo',
    proyecto_id: 'PRY-CRM-001',
    cliente_id: 62,
    factura_id: null,
    entidad_tipo: 'proyecto',
    entidad_id: 'PRY-CRM-001',
    usuario: 'Juan José'
  };
  
  console.log('\n=== Insertar registro en tabla documentos ===');
  console.log('Datos:', JSON.stringify(docData, null, 2).substring(0, 300));
  
  const insertData = JSON.stringify([docData]);
  const insertOptions = {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': 'Bearer ' + anonKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    }
  };
  
  const insertReq = https.request(supabaseUrl + '/rest/v1/documentos', insertOptions, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('\n--- Resultado inserción ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body.substring(0, 400));
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n✅ Registro insertado exitosamente');
        console.log('\n=== FLUJO COMPLETO VERIFICADO ===');
        console.log('1. ✅ Bucket crm-documents existe y acepta uploads');
        console.log('2. ✅ Upload de archivo HTML funciona');
        console.log('3. ✅ Signed URL funciona (acceso al archivo)');
        console.log('4. ✅ Registro en tabla documentos creado');
        console.log('\n¡El flujo completo de documentos funciona!');
      } else {
        console.log('\n❌ Inserción falló');
        console.log('Revisa que las columnas del schema coincidan');
      }
    });
  });
  
  insertReq.on('error', (e) => console.log('Error inserción:', e.message));
  insertReq.write(insertData);
  insertReq.end();
}
