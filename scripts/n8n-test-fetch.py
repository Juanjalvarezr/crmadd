import json
import subprocess
import urllib.request

N8N = "http://localhost:5678/api/v1"
N8N_KEY = open(r"C:/Users/jujoa/AppData/Local/hermes/cache/scratch/n8n_key.txt").read().strip()

# Leer claves
openwa_key = subprocess.check_output(
    ["docker", "exec", "openwa", "cat", "/app/data/.api-key"], text=True
).strip()

env = open(r"C:/Users/jujoa/Desktop/Proyectos Personales/3-crm-agencia/.env", encoding="utf-8").read()
import re
supa_url = re.search(r"VITE_SUPABASE_URL=(.+)", env).group(1).strip()
supa_key = re.search(r"VITE_SUPABASE_ANON_KEY=(.+)", env).group(1).strip()

SESSION = "cbe37055-b28f-4931-8176-968eed68dc71"

code_test = f"""
const OPENWA = "{openwa_key}";
const SESSION = "{SESSION}";
try {{
  const r = await fetch(`http://openwa:2785/api/sessions/${{SESSION}}/messages?limit=5`, {{
    headers: {{ "X-API-Key": OPENWA }}
  }});
  const d = await r.json();
  const n = (d.messages || []).length;
  return [{{ json: {{ ok: true, count: n, session: SESSION }} }}];
}} catch (e) {{
  return [{{ json: {{ ok: false, error: String(e) }} }}];
}}
"""

workflow = {
    "name": "CRM - Test OpenWA Fetch",
    "nodes": [
        {
            "parameters": {"rule": {"interval": [{"field": "seconds", "secondsInterval": 60}]}},
            "id": "sched1",
            "name": "Schedule",
            "type": "n8n-nodes-base.scheduleTrigger",
            "typeVersion": 1.2,
            "position": [240, 300],
        },
        {
            "parameters": {"jsCode": code_test},
            "id": "code1",
            "name": "Test Fetch",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [460, 300],
        },
    ],
    "connections": {"Schedule": {"main": [[{"node": "Test Fetch", "type": "main", "index": 0}]]}},
    "settings": {"executionOrder": "v1"},
}

data = json.dumps(workflow).encode()
req = urllib.request.Request(
    f"{N8N}/workflows", data=data, method="POST",
    headers={"X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        res = json.load(r)
        print("CREADO id:", res.get("id"), "nombre:", res.get("name"))
        print("nodos:", [n["name"] for n in res.get("nodes", [])])
except urllib.error.HTTPError as e:
    print("ERROR", e.code, e.read().decode()[:500])
