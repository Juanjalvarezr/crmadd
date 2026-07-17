import { supabase } from './supabase';

export interface ReportMetric {
  nombre: string;
  valor: number;
  cambio_porcentaje?: number;
  periodo: string;
}

export interface ReportData {
  periodo: string;
  metricas: ReportMetric[];
  graficos: any[];
}

export interface SalesReport {
  periodo: string;
  total_ventas: number;
  total_propuestas: number;
  tasa_conversion: number;
  promedio_venta: number;
  por_etapa: Record<string, number>;
  por_vendedor: Record<string, number>;
}

export interface LeadReport {
  periodo: string;
  total_leads: number;
  leads_calificados: number;
  leads_frios: number;
  leads_calientes: number;
  score_promedio: number;
  origen_leads: Record<string, number>;
}

export interface ProjectReport {
  periodo: string;
  total_proyectos: number;
  proyectos_activos: number;
  proyectos_completados: number;
  proyectos_vencidos: number;
  presupuesto_total: number;
  presupuesto_ejecutado: number;
}

/**
 * Genera reporte de ventas para un periodo
 */
export const generateSalesReport = async (
  fechaInicio: string,
  fechaFin: string
): Promise<SalesReport> => {
  try {
    const { data: oportunidades } = await supabase
      .from('oportunidades')
      .select('*')
      .gte('created_at', fechaInicio)
      .lte('created_at', fechaFin);

    if (!oportunidades) {
      return {
        periodo: `${fechaInicio} - ${fechaFin}`,
        total_ventas: 0,
        total_propuestas: 0,
        tasa_conversion: 0,
        promedio_venta: 0,
        por_etapa: {},
        por_vendedor: {},
      };
    }

    const totalVentas = oportunidades
      .filter((o: any) => o.etapa === 'ganado')
      .reduce((sum: number, o: any) => sum + (o.monto || 0), 0);

    const totalPropuestas = oportunidades.length;
    const ganadas = oportunidades.filter((o: any) => o.etapa === 'ganado').length;
    const tasaConversion = totalPropuestas > 0 ? (ganadas / totalPropuestas) * 100 : 0;
    const promedioVenta = ganadas > 0 ? totalVentas / ganadas : 0;

    // Agrupar por etapa
    const porEtapa: Record<string, number> = {};
    oportunidades.forEach((o: any) => {
      porEtapa[o.etapa] = (porEtapa[o.etapa] || 0) + 1;
    });

    // Agrupar por vendedor
    const porVendedor: Record<string, number> = {};
    oportunidades.forEach((o: any) => {
      if (o.vendedor) {
        porVendedor[o.vendedor] = (porVendedor[o.vendedor] || 0) + (o.monto || 0);
      }
    });

    return {
      periodo: `${fechaInicio} - ${fechaFin}`,
      total_ventas: totalVentas,
      total_propuestas: totalPropuestas,
      tasa_conversion: tasaConversion,
      promedio_venta: promedioVenta,
      por_etapa: porEtapa,
      por_vendedor: porVendedor,
    };
  } catch (error) {
    console.error('Error generando reporte de ventas:', error);
    throw error;
  }
};

/**
 * Genera reporte de leads para un periodo
 */
export const generateLeadReport = async (
  fechaInicio: string,
  fechaFin: string
): Promise<LeadReport> => {
  try {
    const { data: clientes } = await supabase
      .from('clientes')
      .select('*')
      .gte('created_at', fechaInicio)
      .lte('created_at', fechaFin);

    if (!clientes) {
      return {
        periodo: `${fechaInicio} - ${fechaFin}`,
        total_leads: 0,
        leads_calificados: 0,
        leads_frios: 0,
        leads_calientes: 0,
        score_promedio: 0,
        origen_leads: {},
      };
    }

    const totalLeads = clientes.length;
    const leadsCalificados = clientes.filter((c: any) => c.lead_score >= 50).length;
    const leadsFrios = clientes.filter((c: any) => c.lead_score < 30).length;
    const leadsCalientes = clientes.filter((c: any) => c.lead_score >= 70).length;

    const scorePromedio =
      clientes.length > 0
        ? clientes.reduce((sum: number, c: any) => sum + (c.lead_score || 0), 0) / clientes.length
        : 0;

    // Agrupar por origen
    const origenLeads: Record<string, number> = {};
    clientes.forEach((c: any) => {
      if (c.origen) {
        origenLeads[c.origen] = (origenLeads[c.origen] || 0) + 1;
      }
    });

    return {
      periodo: `${fechaInicio} - ${fechaFin}`,
      total_leads: totalLeads,
      leads_calificados: leadsCalificados,
      leads_frios: leadsFrios,
      leads_calientes: leadsCalientes,
      score_promedio: scorePromedio,
      origen_leads: origenLeads,
    };
  } catch (error) {
    console.error('Error generando reporte de leads:', error);
    throw error;
  }
};

/**
 * Genera reporte de proyectos para un periodo
 */
export const generateProjectReport = async (
  fechaInicio: string,
  fechaFin: string
): Promise<ProjectReport> => {
  try {
    const { data: proyectos } = await supabase
      .from('proyectos')
      .select('*')
      .gte('created_at', fechaInicio)
      .lte('created_at', fechaFin);

    if (!proyectos) {
      return {
        periodo: `${fechaInicio} - ${fechaFin}`,
        total_proyectos: 0,
        proyectos_activos: 0,
        proyectos_completados: 0,
        proyectos_vencidos: 0,
        presupuesto_total: 0,
        presupuesto_ejecutado: 0,
      };
    }

    const totalProyectos = proyectos.length;
    const proyectosActivos = proyectos.filter((p: any) => p.estado === 'activo').length;
    const proyectosCompletados = proyectos.filter((p: any) => p.estado === 'completado').length;

    const hoy = new Date();
    const proyectosVencidos = proyectos.filter((p: any) => {
      const fechaFin = new Date(p.fecha_fin);
      return fechaFin < hoy && p.estado !== 'completado';
    }).length;

    const presupuestoTotal = proyectos.reduce((sum: number, p: any) => sum + (p.presupuesto || 0), 0);
    const presupuestoEjecutado = proyectos
      .filter((p: any) => p.estado === 'completado')
      .reduce((sum: number, p: any) => sum + (p.presupuesto || 0), 0);

    return {
      periodo: `${fechaInicio} - ${fechaFin}`,
      total_proyectos: totalProyectos,
      proyectos_activos: proyectosActivos,
      proyectos_completados: proyectosCompletados,
      proyectos_vencidos: proyectosVencidos,
      presupuesto_total: presupuestoTotal,
      presupuesto_ejecutado: presupuestoEjecutado,
    };
  } catch (error) {
    console.error('Error generando reporte de proyectos:', error);
    throw error;
  }
};

/**
 * Genera reporte de tareas para un periodo
 */
export const generateTaskReport = async (
  fechaInicio: string,
  fechaFin: string
): Promise<any> => {
  try {
    const { data: tareas } = await supabase
      .from('tareas')
      .select('*')
      .gte('created_at', fechaInicio)
      .lte('created_at', fechaFin);

    if (!tareas) {
      return {
        periodo: `${fechaInicio} - ${fechaFin}`,
        total_tareas: 0,
        tareas_completadas: 0,
        tareas_pendientes: 0,
        tareas_vencidas: 0,
        por_prioridad: {},
        por_asignado: {},
      };
    }

    const totalTareas = tareas.length;
    const tareasCompletadas = tareas.filter((t: any) => t.estado === 'completada').length;
    const tareasPendientes = tareas.filter((t: any) => t.estado === 'pendiente').length;

    const hoy = new Date();
    const tareasVencidas = tareas.filter((t: any) => {
      const fecha = new Date(t.fecha);
      return fecha < hoy && t.estado !== 'completada';
    }).length;

    // Agrupar por prioridad
    const porPrioridad: Record<string, number> = {};
    tareas.forEach((t: any) => {
      porPrioridad[t.prioridad] = (porPrioridad[t.prioridad] || 0) + 1;
    });

    // Agrupar por asignado
    const porAsignado: Record<string, number> = {};
    tareas.forEach((t: any) => {
      if (t.asignado_a) {
        porAsignado[t.asignado_a] = (porAsignado[t.asignado_a] || 0) + 1;
      }
    });

    return {
      periodo: `${fechaInicio} - ${fechaFin}`,
      total_tareas: totalTareas,
      tareas_completadas: tareasCompletadas,
      tareas_pendientes: tareasPendientes,
      tareas_vencidas: tareasVencidas,
      por_prioridad: porPrioridad,
      por_asignado: porAsignado,
    };
  } catch (error) {
    console.error('Error generando reporte de tareas:', error);
    throw error;
  }
};

/**
 * Genera reporte de facturación para un periodo
 */
export const generateBillingReport = async (
  fechaInicio: string,
  fechaFin: string
): Promise<any> => {
  try {
    const { data: facturas } = await supabase
      .from('facturas')
      .select('*')
      .gte('created_at', fechaInicio)
      .lte('created_at', fechaFin);

    if (!facturas) {
      return {
        periodo: `${fechaInicio} - ${fechaFin}`,
        total_facturado: 0,
        facturas_pagadas: 0,
        facturas_pendientes: 0,
        facturas_vencidas: 0,
        por_estado: {},
      };
    }

    const totalFacturado = facturas.reduce((sum: number, f: any) => sum + (f.monto || 0), 0);
    const facturasPagadas = facturas.filter((f: any) => f.estado === 'pagada').length;
    const facturasPendientes = facturas.filter((f: any) => f.estado === 'pendiente').length;
    const facturasVencidas = facturas.filter((f: any) => f.estado === 'vencida').length;

    // Agrupar por estado
    const porEstado: Record<string, number> = {};
    facturas.forEach((f: any) => {
      porEstado[f.estado] = (porEstado[f.estado] || 0) + 1;
    });

    return {
      periodo: `${fechaInicio} - ${fechaFin}`,
      total_facturado: totalFacturado,
      facturas_pagadas: facturasPagadas,
      facturas_pendientes: facturasPendientes,
      facturas_vencidas: facturasVencidas,
      por_estado: porEstado,
    };
  } catch (error) {
    console.error('Error generando reporte de facturación:', error);
    throw error;
  }
};

/**
 * Genera reporte ejecutivo consolidado
 */
export const generateExecutiveReport = async (
  fechaInicio: string,
  fechaFin: string
): Promise<any> => {
  try {
    const [salesReport, leadReport, projectReport, taskReport, billingReport] = await Promise.all([
      generateSalesReport(fechaInicio, fechaFin),
      generateLeadReport(fechaInicio, fechaFin),
      generateProjectReport(fechaInicio, fechaFin),
      generateTaskReport(fechaInicio, fechaFin),
      generateBillingReport(fechaInicio, fechaFin),
    ]);

    return {
      periodo: `${fechaInicio} - ${fechaFin}`,
      ventas: salesReport,
      leads: leadReport,
      proyectos: projectReport,
      tareas: taskReport,
      facturacion: billingReport,
      resumen: {
        total_ingresos: salesReport.total_ventas,
        total_leads: leadReport.total_leads,
        tasa_conversion_global: leadReport.total_leads > 0 
          ? (salesReport.total_propuestas / leadReport.total_leads) * 100 
          : 0,
        proyectos_activos: projectReport.proyectos_activos,
        tareas_pendientes: taskReport.tareas_pendientes,
      },
    };
  } catch (error) {
    console.error('Error generando reporte ejecutivo:', error);
    throw error;
  }
};

/**
 * Exporta reporte a CSV
 */
export const exportReportToCSV = async (reportData: any, filename: string): Promise<void> => {
  try {
    const rows: string[] = [];

    // Convertir datos a formato CSV
    const flattenObject = (obj: any, prefix = ''): string[] => {
      const result: string[] = [];
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          result.push(...flattenObject(value, newKey));
        } else {
          result.push(`${newKey},${value}`);
        }
      }
      return result;
    };

    const headers = new Set<string>();
    const dataRows: any[] = [];

    if (Array.isArray(reportData)) {
      reportData.forEach(item => {
        const flat = flattenObject(item);
        flat.forEach(row => {
          const [key] = row.split(',');
          headers.add(key);
        });
        dataRows.push(flat);
      });
    } else {
      const flat = flattenObject(reportData);
      flat.forEach(row => {
        const [key] = row.split(',');
        headers.add(key);
      });
      dataRows.push(flat);
    }

    // Crear CSV
    rows.push(Array.from(headers).join(','));
    dataRows.forEach(row => {
      const rowData: Record<string, string> = {};
      row.forEach((r: string) => {
        const [key, value] = r.split(',');
        rowData[key] = value;
      });
      const orderedRow = Array.from(headers).map(h => rowData[h] || '');
      rows.push(orderedRow.join(','));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  } catch (error) {
    console.error('Error exportando reporte a CSV:', error);
    throw error;
  }
};

/**
 * Obtiene métricas del dashboard en tiempo real
 */
export const getDashboardMetrics = async (): Promise<any> => {
  try {
    const [clientes, proyectos, tareas, oportunidades, facturas] = await Promise.all([
      supabase.from('clientes').select('*'),
      supabase.from('proyectos').select('*'),
      supabase.from('tareas').select('*'),
      supabase.from('oportunidades').select('*'),
      supabase.from('facturas').select('*'),
    ]);

    return {
      clientes: {
        total: clientes.data?.length || 0,
        nuevos_mes: clientes.data?.filter((c: any) => {
          const created = new Date(c.created_at);
          const mesAgo = new Date();
          mesAgo.setMonth(mesAgo.getMonth() - 1);
          return created >= mesAgo;
        }).length || 0,
      },
      proyectos: {
        total: proyectos.data?.length || 0,
        activos: proyectos.data?.filter((p: any) => p.estado === 'activo').length || 0,
      },
      tareas: {
        total: tareas.data?.length || 0,
        pendientes: tareas.data?.filter((t: any) => t.estado === 'pendiente').length || 0,
      },
      ventas: {
        pipeline: oportunidades.data?.length || 0,
        ganadas: oportunidades.data?.filter((o: any) => o.etapa === 'ganado').length || 0,
      },
      facturacion: {
        total: facturas.data?.reduce((sum: number, f: any) => sum + (f.monto || 0), 0) || 0,
        pendientes: facturas.data?.filter((f: any) => f.estado === 'pendiente').length || 0,
      },
    };
  } catch (error) {
    console.error('Error obteniendo métricas del dashboard:', error);
    throw error;
  }
};
