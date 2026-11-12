import json

src = r"C:/Users/jujoa/AppData/Local/hermes/cache/scratch/openwa_qr2.json"
dst = r"C:/Users/jujoa/Desktop/Proyectos Personales/3-crm-agencia/openwa-qr.html"

d = json.load(open(src, encoding="utf-8"))
qr = d["qrCode"]
html = (
    '<!doctype html><html><head><meta charset="utf-8"><title>OpenWA QR</title></head>'
    '<body style="margin:0;background:#fff;display:flex;justify-content:center;align-items:center;height:100vh">'
    '<img src="' + qr + '" style="width:420px;height:420px" alt="QR OpenWA">'
    "</body></html>"
)
open(dst, "w", encoding="utf-8").write(html)
print("HTML guardado en", dst)
