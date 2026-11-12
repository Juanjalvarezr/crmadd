import json
import urllib.request

N8N = "http://localhost:5678/api/v1"
N8N_KEY = open(r"C:/Users/jujoa/AppData/Local/hermes/cache/scratch/n8n_key.txt").read().strip()
WID = "x21X2JSGMxB5Nsei"

req = urllib.request.Request(
    f"{N8N}/executions?workflowId={WID}&limit=5",
    headers={"X-N8N-API-KEY": N8N_KEY},
)
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        d = json.load(r)
    for e in d.get("data", []):
        print("exec:", e.get("id"), "| status:", e.get("status"), "| mode:", e.get("mode"), "| startedAt:", e.get("startedAt"))
        if e.get("status") == "error":
            print("   error:", str(e.get("data", {}))[:300])
except urllib.error.HTTPError as e:
    print("ERROR", e.code, e.read().decode()[:300])
