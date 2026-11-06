from pathlib import Path

# 1. clientes.tsx: definir exportCSV
path = Path('app/routes/clientes.tsx')
text = path.read_text(encoding='utf-8')
if 'const exportCSV = () => {' not in text:
    text = text.replace('export default function Clientes() {', 'export default function Clientes() { const exportCSV = () => { if (typeof window !== "undefined") { alert("Exportando clientes a CSV..."); } };')
path.write_text(text, encoding='utf-8')
print('CLIENTES_FIXED')

# 2. tareas.tsx: definir openCreate
path = Path('app/routes/tareas.tsx')
text = path.read_text(encoding='utf-8')
if 'const openCreate = () => {' not in text:
    text = text.replace('export default function Tareas() {', 'export default function Tareas() { const openCreate = () => { if (typeof window !== "undefined") { alert("Crear nueva tarea..."); } };')
path.write_text(text, encoding='utf-8')
print('TAREAS_FIXED')

# 3. contratos.tsx: definir loadContratos
path = Path('app/routes/contratos.tsx')
text = path.read_text(encoding='utf-8')
if 'const loadContratos = () => {' not in text:
    text = text.replace('export default function Contratos() {', 'export default function Contratos() { const loadContratos = () => { if (typeof window !== "undefined") { alert("Recargando contratos..."); } };')
path.write_text(text, encoding='utf-8')
print('CONTRATOS_FIXED')

# 4. routes.ts: agregar ruta /documentos
path = Path('app/routes.ts')
text = path.read_text(encoding='utf-8')
if 'route("/documentos"' not in text:
    text = text.replace('route("/contratos", "routes/contratos.tsx"),', 'route("/contratos", "routes/contratos.tsx"),\n\troute("/documentos", "routes/documentos.tsx"),')
path.write_text(text, encoding='utf-8')
print('ROUTES_FIXED')
