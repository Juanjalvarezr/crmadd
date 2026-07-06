import { generarFacturaPDF, generarContratoPDF, linkWhatsApp } from './pdf';
import { supabase } from './supabase';

export const cuotasService = {
  getAll: () => supabase.from('cuotas').select('*').order('fecha_vencimiento', { ascending: true }).then(r => r.data || []),
  getByTransaccion: (transaccionId: string) => supabase.from('cuotas').select('*').eq('transaccion_id', transaccionId).order('fecha_vencimiento', { ascending: true }).then(r => r.data || []),
  create: (item: any) => supabase.from('cuotas').insert(item).select().single().then(r => r.data),
  update: (id: string, updates: any) => supabase.from('cuotas').update(updates).eq('id', id).select().single().then(r => r.data),
  delete: (id: string) => supabase.from('cuotas').delete().eq('id', id).then(r => r.data),
};

export const facturasService = {
  getAll: () => supabase.from('facturas').select('*').order('fecha_emision', { ascending: false }).then(r => r.data || []),
  getById: (id: string) => supabase.from('facturas').select('*').eq('id', id).single().then(r => r.data),
  create: (item: any) => supabase.from('facturas').insert(item).select().single().then(r => r.data),
  update: (id: string, updates: any) => supabase.from('facturas').update(updates).eq('id', id).select().single().then(r => r.data),
  delete: (id: string) => supabase.from('facturas').delete().eq('id', id).then(r => r.data),
  enviarEmail: (factura: any, html: string) => fetch('/api/email-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: [], subject: 'Factura ' + (factura.numero || factura.id), html }) }).then(r => r.json()),
  linkWhatsApp: (factura: any) => linkWhatsApp(factura.cliente?.telefono || '', 'Hola, te comparto la factura ' + (factura.numero || factura.id) + ' por un valor de ' + factura.total),
  pdf: (factura: any, cliente?: any, items?: any[]) => generarFacturaPDF(factura, cliente, items),
};

export const contratosService = {
  getAll: () => supabase.from('contratos').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
  getById: (id: string) => supabase.from('contratos').select('*').eq('id', id).single().then(r => r.data),
  create: (item: any) => supabase.from('contratos').insert(item).select().single().then(r => r.data),
  update: (id: string, updates: any) => supabase.from('contratos').update(updates).eq('id', id).select().single().then(r => r.data),
  delete: (id: string) => supabase.from('contratos').delete().eq('id', id).then(r => r.data),
  enviarEmail: (contrato: any, html: string) => fetch('/api/email-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: [], subject: 'Contrato ' + (contrato.numero || contrato.id), html }) }).then(r => r.json()),
  linkWhatsApp: (contrato: any) => linkWhatsApp(contrato.cliente?.telefono || '', 'Hola, te comparto el contrato ' + (contrato.numero || contrato.id)),
  pdf: (contrato: any, cliente?: any) => generarContratoPDF(contrato, cliente),
};
