import json
import base64

src = r"C:/Users/jujoa/AppData/Local/hermes/cache/scratch/openwa_qr2.json"
dst = r"C:/Users/jujoa/Desktop/Proyectos Personales/3-crm-agencia/openwa-qr-direct.png"

d = json.load(open(src, encoding="utf-8"))
qr = d["qrCode"]
if qr.startswith("data:image"):
    b64 = qr.split(",", 1)[1]
else:
    b64 = qr
png = base64.b64decode(b64)
open(dst, "wb").write(png)
print("PNG guardado:", dst, "bytes:", len(png))
