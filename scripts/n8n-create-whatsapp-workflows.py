import json
import re
import subprocess
import urllib.request

N8N = "http://localhost:5678/api/v1"
N8N_KEY = open(r"C:/Users/jujoa/AppData/Local/hermes/cache/scratch/n8n_key.txt").read().strip()

openwa_key = subprocess.check_output(
    ["docker", "exec", "openwa", "cat", "/app/data/.api-key"], text=True
).strip()

env = open(r"C:/Users/jujoa/Desktop/Proyectos Personales/3-crm-agencia/.env", encoding="utf-8").read()
supa_url = re.search(r"VITE_SUPABASE_URL=(.+)", env).group(1).strip()
supa_key = re.search(r"VITE_SUPABASE_ANON_KEY=(.+)", env).group(1).strip()

SESSION = "cbe37055-b28f-4931-8176-968eed68dc71"
CHANNEL_ID = 1

# ---------- Codigo n8n ----------
CODE_INBOUND = """
const SUPA = "%s";
const SUPA_KEY = "%s";
const OPENWA_KEY = "%s";
const SESSION = "%s";
const CHANNEL_ID = %d;

const H = { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY, "Content-Type": "application/json" };

async function jget(path) {
  const r = await fetch(SUPA + "/rest/v1/" + path, { headers: H });
  return await r.json();
}

try {
  const r = await fetch("http://openwa:2785/api/sessions/" + SESSION + "/messages?limit=100", {
    headers: { "X-API-Key": OPENWA_KEY }
  });
  const data = await r.json();
  const messages = data.messages || [];

  let inserted = 0, skipped = 0, errors = 0;

  for (const m of messages) {
    if (m.direction !== "incoming") continue;
    const externalId = m.waMessageId;
    try {
      const dup = await jget("conversation_messages?external_id=eq." + encodeURIComponent(externalId) + "&select=id");
      if (dup.length > 0) { skipped++; continue; }

      // upsert contact
      await fetch(SUPA + "/rest/v1/channel_contacts", {
        method: "POST",
        headers: Object.assign({}, H, { Prefer: "resolution=merge-duplicates" }),
        body: JSON.stringify({
          channel_id: CHANNEL_ID,
          external_id: m.chatId,
          nombre: m.chatName || null,
          telefono: m.from || null,
          metadata: { pushName: m.chatName || null }
        })
      });
      const cArr = await jget("channel_contacts?channel_id=eq." + CHANNEL_ID + "&external_id=eq." + encodeURIComponent(m.chatId) + "&select=id");
      const contactId = cArr[0] ? cArr[0].id : null;
      if (!contactId) { errors++; continue; }

      // conversation (select -> insert/update)
      const vArr = await jget("conversations?channel_id=eq." + CHANNEL_ID + "&contact_id=eq." + contactId + "&select=id");
      let convId = vArr[0] ? vArr[0].id : null;
      const ts = new Date((m.timestamp || 0) * 1000).toISOString();
      if (convId) {
        await fetch(SUPA + "/rest/v1/conversations?id=eq." + convId, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ ultimo_mensaje: m.body || m.type || "", ultimo_mensaje_en: ts })
        });
      } else {
        const ins = await fetch(SUPA + "/rest/v1/conversations", {
          method: "POST", headers: Object.assign({}, H, { Prefer: "return=representation" }),
          body: JSON.stringify({ channel_id: CHANNEL_ID, contact_id: contactId, estado: "abierta", ultimo_mensaje: m.body || m.type || "", ultimo_mensaje_en: ts })
        });
        const insArr = await ins.json();
        convId = insArr[0] ? insArr[0].id : null;
      }
      if (!convId) { errors++; continue; }

      // insert message
      await fetch(SUPA + "/rest/v1/conversation_messages", {
        method: "POST", headers: H,
        body: JSON.stringify({
          conversation_id: convId,
          external_id: externalId,
          direccion: "inbound",
          tipo: m.type || "texto",
          cuerpo: m.body || "",
          estado: "recibido",
          enviado_por: m.from || null
        })
      });

      // audit
      await fetch(SUPA + "/rest/v1/webhook_events_log", {
        method: "POST", headers: H,
        body: JSON.stringify({ canal: "openwa", external_id: externalId, raw: m, status: "processed" })
      });

      inserted++;
    } catch (e) {
      errors++;
    }
  }

  return [{ json: { ok: true, total: messages.length, inserted: inserted, skipped: skipped, errors: errors } }];
} catch (e) {
  return [{ json: { ok: false, error: String(e) } }];
}
""" % (supa_url, supa_key, openwa_key, SESSION, CHANNEL_ID)

CODE_OUTBOUND = """
const SUPA = "%s";
const SUPA_KEY = "%s";
const OPENWA_KEY = "%s";
const SESSION = "%s";

const H = { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY, "Content-Type": "application/json" };

async function jget(path) {
  const r = await fetch(SUPA + "/rest/v1/" + path, { headers: H });
  return await r.json();
}

try {
  const pending = await jget("conversation_messages?direccion=eq.outbound&estado=eq.pending&select=*");

  let sent = 0, errors = 0;

  for (const msg of pending) {
    try {
      const vArr = await jget("conversations?id=eq." + msg.conversation_id + "&select=contact_id");
      const contactId = vArr[0] ? vArr[0].contact_id : null;
      if (!contactId) { errors++; continue; }
      const cArr = await jget("channel_contacts?id=eq." + contactId + "&select=telefono,external_id");
      const chatId = (cArr[0] && (cArr[0].telefono || cArr[0].external_id)) || null;
      if (!chatId) { errors++; continue; }

      const to = chatId.indexOf("@") >= 0 ? chatId : chatId.replace(/\\D/g, "") + "@c.us";
      const sRes = await fetch("http://openwa:2785/api/sessions/" + SESSION + "/messages/send-text", {
        method: "POST",
        headers: { "X-API-Key": OPENWA_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: to, text: msg.cuerpo || "" })
      });
      if (!sRes.ok) { errors++; continue; }

      await fetch(SUPA + "/rest/v1/conversation_messages?id=eq." + msg.id, {
        method: "PATCH", headers: H,
        body: JSON.stringify({ estado: "sent" })
      });
      sent++;
    } catch (e) {
      errors++;
    }
  }

  return [{ json: { ok: true, pending: pending.length, sent: sent, errors: errors } }];
} catch (e) {
  return [{ json: { ok: false, error: String(e) } }];
}
""" % (supa_url, supa_key, openwa_key, SESSION)


def make_workflow(name, code):
    return {
        "name": name,
        "nodes": [
            {
                "parameters": {"rule": {"interval": [{"field": "seconds", "secondsInterval": 30}]}},
                "id": "sched1",
                "name": "Schedule",
                "type": "n8n-nodes-base.scheduleTrigger",
                "typeVersion": 1.2,
                "position": [240, 300],
            },
            {
                "parameters": {"jsCode": code},
                "id": "code1",
                "name": "Procesar",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [460, 300],
            },
        ],
        "connections": {"Schedule": {"main": [[{"node": "Procesar", "type": "main", "index": 0}]]}},
        "settings": {"executionOrder": "v1"},
    }


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{N8N}{path}", data=data, method=method,
        headers={"X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]


for name, code in [
    ("CRM - Inbound WhatsApp (OpenWA)", CODE_INBOUND),
    ("CRM - Outbound WhatsApp (OpenWA)", CODE_OUTBOUND),
]:
    s, b = call("POST", "/workflows", make_workflow(name, code))
    if s == 200:
        wf = json.loads(b)
        print("CREADO:", wf["id"], "|", wf["name"])
        s2, b2 = call("POST", f"/workflows/{wf['id']}/activate")
        print("  activar:", s2)
    else:
        print("ERROR", s, b[:300])
