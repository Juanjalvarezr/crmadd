from pathlib import Path
path = Path('app/routes/dashboard.tsx')
text = path.read_text(encoding='utf-8')
# 1) Remove bad healthz effect
bad = """  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/healthz');
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setDbStatus({ ok: res.ok, message: data.message || (res.ok ? 'API OK' : 'API caída') });
      } catch (e: any) {
        if (!cancelled) setDbStatus({ ok: false, message: 'Sin conexión con el backend' });
      }
    })();
    return () => { cancelled = true; };
  }, []);"""
text = text.replace(bad, '')
# 2) Show store error and empty states
old_return = """  if (storeIsLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return ("""
new_return = """  if (storeIsLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (storeError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{storeError}</Alert>
        <Button variant="contained" onClick={() => fetchDashboardData()}>Reintentar</Button>
      </Box>
    );
  }

  const hasData = (clientes?.length || proyectos?.length || oportunidades?.length || tareas?.length);
  if (!hasData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>No hay datos registrados aún. Comienza agregando clientes, proyectos o tareas.</Alert>
        <Button variant="contained" onClick={() => fetchDashboardData()}>Actualizar</Button>
      </Box>
    );
  }

  return ("""
text = text.replace(old_return, new_return, 1)
path.write_text(text, encoding='utf-8')
print('PATCHED')
