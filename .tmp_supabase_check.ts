import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

(async () => {
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log("buckets", buckets?.map((b: any) => b.name) || [], bErr ? "ERR:" + bErr.message : "");

  const { data: newBucket, error: nbErr } = await supabase.storage.createBucket("crm-documents", { public: false });
  console.log("create bucket", newBucket?.name || nbErr?.message);

  const tables = ["crm_events", "documentos", "facturas", "cotizaciones", "tareas", "logs", "audit_logs", "plantillas_documentos"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("count").limit(1);
    console.log(t, error ? "ERR:" + error.message : "OK");
  }
})();
