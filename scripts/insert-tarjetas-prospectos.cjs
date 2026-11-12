#!/usr/bin/env node
/**
 * Insertar prospectos extraídos de tarjetas físicas
 * al CRM DESEO DIGITAL (tabla prospecting_pipeline de Supabase)
 *
 * Uso: node scripts/insert-tarjetas-prospectos.cjs
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno desde .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eqIdx = trimmed.indexOf('=');
      const key = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falten credenciales en .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Prospectos extraídos de tarjetas físicas — mapeo a interfaz Prospecto
const prospectos = [
  {
    codigo: 'TAPIC-001',
    nombre: 'TAPICERIA AUDIO & Lujos',
    tipo_negocio: 'Automotriz',
    descripcion: 'Fabricación y personalización de forros y tapetes vehiculares.',
    telefono: '3144514554',
    email: '',
    origen: 'tarjeta_fisica',
    estado: 'pendiente',
    es_prospecto: true,
    listo_contactar: true,
    servicios: ['forros','tapetes','personalizacion'],
    fecha_extraccion: new Date().toISOString().split('T')[0],
  },
  {
    codigo: 'TV-001',
    nombre: 'REPARACIÓN TELEVISORES',
    tipo_negocio: 'Electrónica',
    descripcion: 'Reparación de televisores. Ubicado en Cra. 26 No. 35-09 local 1, Villavicencio.',
    telefono: '3108765434',
    email: 'jairojel@gmail.com',
    direccion: 'Cra. 26 No. 35-09 local 1, Villavicencio',
    origen: 'tarjeta_fisica',
    estado: 'pendiente',
    es_prospecto: true,
    listo_contactar: true,
    servicios: ['reparacion_televisores'],
    fecha_extraccion: new Date().toISOString().split('T')[0],
  },
  {
    codigo: 'VILL-001',
    nombre: 'Villa Alicia',
    tipo_negocio: 'Alquiler/Venta',
    descripcion: 'Inmobiliaria o venta de propiedades. Meta.',
    telefono: '3108300559',
    email: '',
    ubicacion: 'Cra. 34 No. 36-74 Br. Barzal, Meta',
    origen: 'tarjeta_fisica',
    estado: 'pendiente',
    es_prospecto: true,
    listo_contactar: true,
    servicios: ['alquiler','venta'],
    fecha_extraccion: new Date().toISOString().split('T')[0],
  },
];

async function insertarProspectos() {
  console.log(`📋 Insertando ${prospectos.length} prospectos de tarjetas físicas...\n`);

  for (const p of prospectos) {
    try {
      const { data, error } = await supabase
        .from('prospecting_pipeline')
        .insert([p])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`⚠️  "${p.nombre}" ya existe (duplicado ignorado)`);
          continue;
        }
        throw error;
      }

      console.log(`✅ "${p.nombre}" — ID: ${data.id} | Código: ${data.codigo}`);
    } catch (err) {
      console.error(`❌ Error insertando "${p.nombre}": ${err.message}`);
    }
  }

  console.log('\n📊 Verificando total de prospectos en pipeline...\n');
  const { data: all, error: err } = await supabase
    .from('prospecting_pipeline')
    .select('id, codigo, nombre, telefono, email, estado, origen, fecha_extraccion')
    .order('fecha_extraccion', { ascending: false })
    .limit(20);

  if (err) {
    console.error('❌ Error consultando:', err.message);
    process.exit(1);
  }

  if (!all || all.length === 0) {
    console.log('⚠️  No hay prospectos en la tabla.');
    return;
  }

  console.log(`📋 TOTAL: ${all.length} prospectos en prospecting_pipeline\n`);
  all.forEach((p, i) => {
    console.log(
      `${i + 1}. ${p.nombre} | 📞 ${p.telefono || '—'} | ✉️ ${p.email || '—'} | Estado: ${p.estado} | Código: ${p.codigo}`
    );
  });

  console.log('\n✅ Listo. Abrí /prospectos en el CRM para ver los registros y gestionar seguimiento.');
  console.log('\n📱 Para contactar por WhatsApp:');
  all.filter(p => p.telefono).forEach(p => {
    console.log(`   → Abrir: https://wa.me/${p.telefono.replace(/[^0-9]/g,'')}`);
  });
}

insertarProspectos().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
