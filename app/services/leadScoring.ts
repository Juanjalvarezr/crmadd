import { supabase } from './supabase';

interface LeadScoreFactors {
  // Interacciones con emails (0-25 puntos)
  email_opens?: number;
  email_clicks?: number;
  email_replies?: number;
  
  // Interacciones con WhatsApp (0-20 puntos)
  whatsapp_messages?: number;
  whatsapp_response_rate?: number;
  
  // Interacciones con propuestas (0-20 puntos)
  proposals_viewed?: number;
  proposals_downloaded?: number;
  
  // Actividad en sitio web (0-15 puntos)
  website_visits?: number;
  pages_per_visit?: number;
  
  // Datos del cliente (0-20 puntos)
  has_complete_profile?: boolean;
  has_company?: boolean;
  has_budget_indication?: boolean;
  
  // Tiempo desde última interacción (0-10 puntos)
  days_since_last_interaction?: number;
}

/**
 * Calcula el score de un lead basado en múltiples factores
 * Rango: 0-100 puntos
 */
export const calculateLeadScore = (factors: LeadScoreFactors): number => {
  let score = 0;
  
  // Interacciones con emails (máx 25 puntos)
  const emailScore = Math.min(
    (factors.email_opens || 0) * 2 +
    (factors.email_clicks || 0) * 3 +
    (factors.email_replies || 0) * 10,
    25
  );
  score += emailScore;
  
  // Interacciones con WhatsApp (máx 20 puntos)
  const whatsappScore = Math.min(
    (factors.whatsapp_messages || 0) * 2 +
    ((factors.whatsapp_response_rate || 0) * 10),
    20
  );
  score += whatsappScore;
  
  // Interacciones con propuestas (máx 20 puntos)
  const proposalScore = Math.min(
    (factors.proposals_viewed || 0) * 5 +
    (factors.proposals_downloaded || 0) * 10,
    20
  );
  score += proposalScore;
  
  // Actividad en sitio web (máx 15 puntos)
  const websiteScore = Math.min(
    (factors.website_visits || 0) * 1 +
    ((factors.pages_per_visit || 0) * 2),
    15
  );
  score += websiteScore;
  
  // Datos del cliente (máx 20 puntos)
  let profileScore = 0;
  if (factors.has_complete_profile) profileScore += 10;
  if (factors.has_company) profileScore += 5;
  if (factors.has_budget_indication) profileScore += 5;
  score += profileScore;
  
  // Tiempo desde última interacción (máx 10 puntos)
  // Más reciente = más puntos
  const daysSince = factors.days_since_last_interaction || 999;
  if (daysSince <= 1) score += 10;
  else if (daysSince <= 3) score += 8;
  else if (daysSince <= 7) score += 5;
  else if (daysSince <= 14) score += 3;
  else if (daysSince <= 30) score += 1;
  
  return Math.min(score, 100);
};

/**
 * Obtiene el nivel de calidad del lead basado en el score
 */
export const getLeadQuality = (score: number): 'hot' | 'warm' | 'cold' => {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
};

/**
 * Obtiene el color para mostrar el score visualmente
 */
export const getLeadScoreColor = (score: number): string => {
  if (score >= 80) return '#4caf50'; // verde - caliente
  if (score >= 50) return '#ff9800'; // naranja - tibio
  return '#9e9e9e'; // gris - frío
};

/**
 * Calcula el score de un cliente basado en datos reales de la base de datos
 */
export const calculateClientScoreFromDB = async (clienteId: number): Promise<number> => {
  try {
    // Obtener interacciones del cliente
    const [tareasRes, oportunidadesRes, proyectosRes] = await Promise.all([
      supabase.from('tareas').select('*').eq('cliente_id', clienteId),
      supabase.from('oportunidades').select('*').eq('cliente_id', clienteId),
      supabase.from('proyectos').select('*').eq('clienteId', clienteId),
    ]);
    
    const tareas = tareasRes.data || [];
    const oportunidades = oportunidadesRes.data || [];
    const proyectos = proyectosRes.data || [];
    
    // Calcular factores
    const factors: LeadScoreFactors = {
      email_opens: tareas.filter(t => t.tipo === 'Email').length,
      whatsapp_messages: tareas.filter(t => t.tipo === 'WhatsApp').length,
      proposals_viewed: oportunidades.length,
      has_complete_profile: true, // Asumimos que si está en DB tiene perfil completo
      has_company: proyectos.length > 0,
      days_since_last_interaction: tareas.length > 0 
        ? Math.floor((Date.now() - new Date(tareas[0].fecha).getTime()) / (1000 * 60 * 60 * 24))
        : 999,
    };
    
    const score = calculateLeadScore(factors);
    
    // Actualizar el score en la base de datos
    await supabase
      .from('clientes')
      .update({ 
        lead_score: score,
        lead_score_last_updated: new Date().toISOString()
      })
      .eq('id', clienteId);
    
    return score;
  } catch (error) {
    console.error('Error calculando lead score:', error);
    return 0;
  }
};

/**
 * Recalcula el score de todos los clientes
 */
export const recalculateAllLeadScores = async (): Promise<void> => {
  try {
    const { data: clientes } = await supabase.from('clientes').select('id');
    
    if (!clientes) return;
    
    for (const cliente of clientes) {
      await calculateClientScoreFromDB(cliente.id);
    }
  } catch (error) {
    console.error('Error recalculando todos los lead scores:', error);
  }
};

/**
 * Obtiene los leads más calientes (score >= 80)
 */
export const getHotLeads = async (): Promise<any[]> => {
  try {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .gte('lead_score', 80)
      .order('lead_score', { ascending: false })
      .limit(20);
    
    return data || [];
  } catch (error) {
    console.error('Error obteniendo hot leads:', error);
    return [];
  }
};
