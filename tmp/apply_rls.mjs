import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function getEnvVar(key) {
  const text = fs.readFileSync('.env', 'utf8');
  const m = text.match(new RegExp('^' + key + '=(.*)$', 'm'));
  return m ? m[1].trim() : null;
}

const url = getEnvVar('VITE_SUPABASE_URL');
const service = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, service, { auth: { persistSession: false } });

async function run() {
  const tables = [
    'clientes',
    'proyectos',
    'tareas',
    'oportunidades',
    'transacciones',
    'contratos',
    'facturas'
  ];

  const actions = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  const policyName = 'Allow authenticated access';

  for (const table of tables) {
    // Eliminar políticas viejas si existen
    for (const action of actions) {
      const sql = `DROP POLICY IF EXISTS "${policyName}" ON public.${table}`;
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error && !error.message.includes('does not exist')) {
        console.error(`DROP ERROR ${table} ${action}:`, error.message);
      }
    }

    // Habilitar RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`
    });
    if (rlsError) console.error(`RLS ERROR ${table}:`, rlsError.message);
    else console.log(`RLS OK ${table}`);

    // Crear políticas nuevas
    for (const action of actions) {
      const check = action === 'SELECT' ? 'USING' : 'WITH CHECK';
      const sql = `CREATE POLICY "${policyName}" ON public.${table} FOR ${action} ${check}(auth.role() = 'authenticated')`;
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) console.error(`POLICY ERROR ${table} ${action}:`, error.message);
      else console.log(`POLICY OK ${table} ${action}`);
    }
  }

  console.log('RLS COMPLETADO');
}

run().catch((e) => { console.error(e); process.exit(1); });
