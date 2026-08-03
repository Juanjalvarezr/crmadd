import React, { useState, useEffect } from "react";
import { useCRMStore } from "../store/useCRMStore";

export function meta() {
  return [{ title: "Contratos | CRM Agencia" }];
}

export default function Contratos() {
  const contratos = useCRMStore((s) => s.contratos);
  const fetchContratos = useCRMStore((s) => s.fetchContratos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchContratos();
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Error al cargar contratos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchContratos]);

  if (loading) return null;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Contratos</h1>
      <p>Total contratos: {contratos.length}</p>
    </div>
  );
}
