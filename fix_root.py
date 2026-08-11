from pathlib import Path
path = Path('app/root.tsx.bak')
text = path.read_text(encoding='utf-8')
# Eliminar solo el gate hydrated y su efecto asociado
old = """  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando CRM...</Typography>
        </Box>
      </Box>
    );
  }

"""
if old not in text:
    print('NO_MATCH')
    exit(1)
text = text.replace(old, '')
path.write_text(text, encoding='utf-8')
print('FIXED')
