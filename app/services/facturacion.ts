import { generarFacturaPDF, generarContratoPDF, linkWhatsApp } from './pdf';
import { supabase } from './supabase';

export const cuotasService = {
  getAll: () => supabase.from('cuotas').select('*').order('fecha_vencimiento', { ascending: true }).then(r => r.data || []),
  getByTransaccion: (transaccionId: string) => supabase.from('cuotas').select('*').eq('transaccion_id', transaccionId).order('fecha_vencimiento', { ascending: true }).then(r => r.data || []),
  create: (item: any) => supabase.from('cuotas').insert(item).select().single().then(r => r.data),
  update: (id: string, updates: any) => supabase.from('cuotas').update(updates).eq('id', id).select().single().then(r => r.data),
  delete: (id: string) => supabase.from('cuotas').delete().eq('id', id).then(r => { if (r.error) throw r.error; return true; }),
};

export const facturasService = {
  getAll: () => supabase.from('facturas').select('*').order('fecha_emision', { ascending: false }).then(r => r.data || []),
  getById: (id: string) => supabase.from('facturas').select('*').eq('id', id).single().then(r => r.data),
  create: (item: any) => supabase.from('facturas').insert(item).select().single().then(r => r.data),
  update: (id: string, updates: any) => supabase.from('facturas').update(updates).eq('id', id).select().single().then(r => r.data),
  delete: (id: string) => supabase.from('facturas').delete().eq('id', id).then(r => { if (r.error) throw r.error; return true; }),

  enviarEmail: (factura: any, html: string) => fetch('/api/email-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: [factura?.cliente_email || factura?.cliente?.email].filter(Boolean), subject: 'Factura ' + (factura.numero || factura.id), html }) }).then(r => r.json()),
  linkWhatsApp: (factura: any) => linkWhatsApp(factura.cliente?.telefono || '', 'Hola, te comparto la factura ' + (factura.numero || factura.id) + ' por un valor de ' + factura.total),
  pdf: (factura: any, cliente?: any, items?: any[]) => generarFacturaPDF(factura, cliente, items),

  getSiguienteNumero: async (year: string) => {
    const prefix = `FAC-${year}-`;
    const { data, error } = await supabase
      .from('facturas')
      .select('numero')
      .like('numero', `${prefix}%`)
      .order('numero', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return `${prefix}0001`;

    const last = data[0].numero;
    const match = last.match(/(\d+)$/);

    if (!match) return `${prefix}0001`;

    const next = String(parseInt(match[1], 10) + 1).padStart(4, '0');
    return `${prefix}${next}`;
  },

  anular: (id: string, motivo: string) => supabase.from('facturas').update({ estado: 'anulada', motivo_anulacion: motivo, actualizado_en: new Date().toISOString() }).eq('id', id).select().single().then(r => r.data),
};
export const contratosService = {
  getAll: () => supabase.from('contratos').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
  getById: (id: string) => supabase.from('contratos').select('*').eq('id', id).single().then(r => r.data),
  create: (item: any) => supabase.from('contratos').insert(item).select().single().then(r => r.data),
  update: (id: string, updates: any) => supabase.from('contratos').update(updates).eq('id', id).select().single().then(r => r.data),
  delete: (id: string) => supabase.from('contratos').delete().eq('id', id).then(r => { if (r.error) throw r.error; return true; }),

  enviarEmail: (contrato: any, html: string) => fetch('/api/email-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: [contrato?.cliente_email || contrato?.cliente?.email].filter(Boolean), subject: 'Contrato ' + (contrato.numero || contrato.id), html }) }).then(r => r.json()),
  linkWhatsApp: (contrato: any) => linkWhatsApp(contrato.cliente?.telefono || '', 'Hola, te comparto el contrato ' + (contrato.numero || contrato.id)),
  pdf: (contrato: any, cliente?: any) => generarContratoPDF(contrato, cliente),

  firmar: (id: string, firma: any) => supabase.from('contratos').update({
    estado: 'firmado',
    firmado_en: new Date().toISOString(),
    firma_datos: firma,
    bloqueado_post_firma: true,
  }).eq('id', id).select().single().then(r => r.data),
};

export const contratoVersionesService = {
  getAll: (id: string) => supabase.from('contrato_versiones').select('*').eq('contrato_id', id).order('version', { ascending: true }).then(r => r.data || []),
  crear: (item: any) => supabase.from('contrato_versiones').insert(item).select().single().then(r => r.data),
};

export const contratoClausulasService = {
  getAll: (_tipo?: string) => supabase.from('contrato_clausulas').select('*').eq('activa', true).order('orden', { ascending: true }).then(r => r.data || []),
  create: (item: any) => supabase.from('contrato_clausulas').insert(item).select().single().then(r => r.data),
  delete: (id: string) => supabase.from('contrato_clausulas').delete().eq('id', id).then(r => r.data),
};

export const alertasRenovacionService = {
  obtenerProximas: () => supabase.from('contratos').select('*').neq('estado', 'cancelado').then(r => {
    const lista = r.data || [];
    const hoy = new Date();
    return lista.filter((c: any) => {
      if (!c.fecha_renovacion) return false;
      const diff = Math.ceil((new Date(c.fecha_renovacion).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= (c.alerta_renovacion_dias || 30);
    });
  }),
};
