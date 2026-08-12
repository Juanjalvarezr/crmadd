
// Reglas duras DESEO DIGITAL ejecutables en el CRM
// No dependen de IA ni texto; son bloqueos/validaciones reales en front y servicios.

export const REGLAS_NEGOCIO = {
  anticipoMinimoProporcion: 0.5,

  onboardingPasos: [
    { id: 'analisis_presencia', label: 'Análisis de presencia', requerido: true },
    { id: 'identidad_digital', label: 'Brief de identidad', requerido: true },
    { id: 'solicitud_accesos', label: 'Solicitud de accesos', requerido: true },
    { id: 'creacion_cronograma', label: 'Creación de cronograma', requerido: true },
    { id: 'anticipo_50', label: 'Anticipo 50%', requerido: true }
  ],

  reelsRequierenIdentidadDigital: true,

  puedeAvanzarOperacion(proyecto: any): { ok: boolean; motivo?: string } {
    if (!proyecto) return { ok: false, motivo: 'Proyecto inválido' };

    const checklist = proyecto.onboardingChecklist || {};
    const faltantes = REGLAS_NEGOCIO.onboardingPasos
      .filter(p => p.requerido && !checklist[p.id])
      .map(p => p.label);

    if (faltantes.length > 0) {
      return { ok: false, motivo: `Falta onboarding: ${faltantes.join(', ')}` };
    }

    if (proyecto.estadoPago === 'pendiente' || proyecto.estadoPago === 'vencido') {
      return { ok: false, motivo: 'Estado de pago pendiente/vencido' };
    }

    return { ok: true };
  },

  puedeMarcarReels(proyecto: any): { ok: boolean; motivo?: string } {
    const checklist = proyecto.onboardingChecklist || {};
    if (REGLAS_NEGOCIO.reelsRequierenIdentidadDigital && !checklist.identidad_digital) {
      return { ok: false, motivo: 'Falta Brief de identidad para Reels' };
    }
    return { ok: true };
  },

  calcularBloqueoOperativo(proyecto: any): string | null {
    const resultado = REGLAS_NEGOCIO.puedeAvanzarOperacion(proyecto);
    return resultado.ok ? null : resultado.motivo || 'Bloqueo operativo';
  }
};
