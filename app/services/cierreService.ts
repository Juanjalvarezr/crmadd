// Cierre de oportunidades: ganado -> crea proyecto; perdido -> guarda motivo.
import { supabase, oportunidadesService, proyectosService, clientesService, interaccionesService } from './supabase';

export const MOTIVOS_PERDIDA = ['Precio', 'Competencia', 'Plazo', 'Servicio', 'Sin presupuesto', 'Otro'];

export async function cerrarOportunidad(
  opp: any,
  opts: { resultado: 'ganado' | 'perdido'; motivo?: string; notas?: string; nombreProyecto?: string }
) {
  const etapa = opts.resultado === 'ganado' ? 'Ganado' : 'Perdido';

  await oportunidadesService.update(opp.id, {
    estado: opts.resultado === 'ganado' ? 'Ganada' : 'Perdida',
    etapa: 'Cierre',
  });

  const clienteId = Number(opp.cliente_id);
  const ahora = new Date().toISOString();

  if (opts.resultado === 'perdido') {
    if (clienteId) {
      await clientesService.update(clienteId, { etapa: 'Perdido', motivo_perdida: opts.motivo || 'Otro', fecha_etapa: ahora, ultima_interaccion: ahora } as any);
      await interaccionesService.create({
        cliente_id: clienteId,
        tipo: 'Nota',
        asunto: 'Oportunidad perdida',
        contenido: `${opts.motivo || ''}${opts.notas ? ' - ' + opts.notas : ''}`.trim(),
        usuario: 'Asistente IA',
      });
    }
    return { ok: true as const, etapa };
  }

  // GANADO -> crea el proyecto automaticamente
  if (clienteId) {
    await clientesService.update(clienteId, { etapa: 'Ganado', fecha_etapa: ahora, ultima_interaccion: ahora } as any);
    const { data: cli } = await supabase.from('clientes').select('nombre').eq('id', clienteId).single();
    const nombre = opts.nombreProyecto || opp.nombre || 'Proyecto ganado';
    await proyectosService.create({
      clienteId: clienteId,
      cliente_id: clienteId,
      clienteNombre: cli?.nombre || opp.cliente_nombre || '',
      cliente_nombre: cli?.nombre || opp.cliente_nombre || '',
      nombre,
      descripcion: opts.notas || `Proyecto ganado desde la oportunidad: ${opp.nombre || ''}`,
      estado: 'Activo',
      prioridad: 'Media',
      fecha_inicio: ahora.slice(0, 10),
      progreso: 0,
      presupuesto: opp.valor || 0,
    });
    await interaccionesService.create({
      cliente_id: clienteId,
      tipo: 'Nota',
      asunto: 'Oportunidad ganada',
      contenido: `Proyecto creado: ${nombre}`,
      usuario: 'Asistente IA',
    });
  }

  return { ok: true as const, etapa, proyecto: opts.nombreProyecto || opp.nombre || 'Proyecto ganado' };
}
