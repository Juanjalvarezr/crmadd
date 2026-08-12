from pathlib import Path
path = Path('app/routes/clientes.tsx')
text = path.read_text(encoding='utf-8')

# 1. Mejorar tabs mobile
old_tabs = '''<Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} variant="scrollable" scrollButtons="auto" size="small" sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0.5, fontSize: { xs: '0.75rem', sm: '0.8rem' }, minWidth: 0, padding: '0 8px' } }}>
                <Tab label="Datos" />
                <Tab label="Proyectos" />
                <Tab label="Oportunidades" />
                <Tab label="Tareas" />
              </Tabs>'''
new_tabs = '''<Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: { xs: 36, sm: 40 }, '& .MuiTab-root': { minHeight: { xs: 36, sm: 40 }, py: { xs: 0.25, sm: 0.5 }, fontSize: { xs: '0.7rem', sm: '0.8rem' }, minWidth: 0, padding: { xs: '0 6px', sm: '0 10px' }, textTransform: 'none' } }} allowScrollButtonsMobile>
                <Tab label="Datos" />
                <Tab label="Proyectos" />
                <Tab label="Oportunidades" />
                <Tab label="Tareas" />
              </Tabs>'''
if old_tabs not in text:
    print('NO_MATCH_TABS')
    exit(1)
text = text.replace(old_tabs, new_tabs)

# 2. Insertar contadores después del título Clientes
old_header = '''<Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Clientes</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>'''
new_header = '''<Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Clientes</Typography>
        <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} sx={{ mt: 1, overflowX: 'auto', pb: 0.5 }}>
          <Chip size="small" label={`Proyectos: ${(clientesData || []).length}`} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, height: { xs: 24, sm: 28 } }} />
          <Chip size="small" label={`Tareas: ${(tareasData || []).length}`} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, height: { xs: 24, sm: 28 } }} />
          <Chip size="small" label={`Facturas: ${(facturasData || []).length}`} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, height: { xs: 24, sm: 28 } }} />
          <Chip size="small" label={`Contratos: ${(contratosData || []).length}`} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, height: { xs: 24, sm: 28 } }} />
        </Stack>
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>'''
if old_header not in text:
    print('NO_MATCH_HEADER')
    exit(1)
text = text.replace(old_header, new_header)

path.write_text(text, encoding='utf-8')
print('CLIENTES_PATCHED')
