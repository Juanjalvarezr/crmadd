from pathlib import Path
path = Path('app/routes/dashboard.tsx')
text = path.read_text(encoding='utf-8')
# Compactar grid de stats
text = text.replace('<Grid container spacing={{ xs: 1, sm: 1.5 }}>\n        <Grid item xs={12} md={6}>', '<Grid container spacing={{ xs: 1, sm: 1.5 }}>\n        <Grid item xs={12} md={8}>')
# Compactar grid de indicadores
text = text.replace('<Grid item xs={6} sm={4} md={2}>', '<Grid item xs={6} sm={6} md={3}>')
# Reducir padding general del main en root.tsx? No, solo dashboard
path.write_text(text, encoding='utf-8')
print('UI_PATCHED')
