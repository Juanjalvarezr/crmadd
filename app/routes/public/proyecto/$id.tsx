import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { proyectosService } from "../../../services/supabase";

export function meta() {
  return [{ title: "Seguimiento de Proyecto | DESEO DIGITAL" }];
}

export default function PublicProyecto() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const list = await proyectosService.getAll();
        const found = list.find((p: any) => String(p.id) === String(id));
        if (!cancel) setData(found || null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  if (loading) return <div className="p-4 text-center">Cargando...</div>;
  if (!data) return <div className="p-4 text-center">Proyecto no encontrado</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{data.nombre}</h1>
      <p className="text-gray-600 mb-4">{data.descripcion}</p>
      <div className="grid grid-cols-2 gap-4">
        <div><strong>Estado:</strong> {data.estado}</div>
        <div><strong>Prioridad:</strong> {data.prioridad}</div>
        <div><strong>Inicio:</strong> {data.fecha_inicio || "-"}</div>
        <div><strong>Fin:</strong> {data.fecha_fin || "-"}</div>
      </div>
    </div>
  );
}
