import json
import urllib.request

N8N = "http://localhost:5678/api/v1"
N8N_KEY = open(r"C:/Users/jujoa/AppData/Local/hermes/cache/scratch/n8n_key.txt").read().strip()
WID = "x21X2JSGMxB5Nsei"

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
        return e.code, e.read().decode()[:600]

# activar
s, b = call("POST", f"/workflows/{WID}/activate")
print("activate:", s, b[:200])

# obtener el workflow para el run
s, b = call("GET", f"/workflows/{WID}")
if s == 200:
    wf = json.loads(b)
    run_body = {"workflowData": {"id": wf["id"], "name": wf["name"], "nodes": wf["nodes"], "connections": wf["connections"], "settings": wf.get("settings", {})}}
    s2, b2 = call("POST", f"/workflows/{WID}/run", run_body)
    print("run:", s2, b2[:400])
else:
    print("get wf:", s, b[:200])
