from pathlib import Path
path = Path('app/routes/dashboard.tsx')
text = path.read_text(encoding='utf-8')
old = """  const calculateStats = useCallback(
    (source: any) => {"""
new = """  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string } | null>(null);

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
  }, []);

  const calculateStats = useCallback(
    (source: any) => {"""
if old not in text:
    raise SystemExit('NO_MATCH')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('PATCHED')
