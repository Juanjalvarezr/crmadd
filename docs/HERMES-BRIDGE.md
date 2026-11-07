# Puente Hermes ↔ CRM (diseño)

## Flujo
1. Tú (chat Hermes) pides: "genera el contrato del cliente X" / "manda cobro"
2. inserted en Supabase `crm_events` con tipo: `generar_contrato` | `generar_plan` | `enviar_cobro`, `leido=false`
3. El CRM (`app/services/crmPollingService.ts`, cada 30s en `root.tsx`) recoge el evento y ejecuta:
   - `generar_contrato` → `generarYGuardarDocumento("contrato", datos)` → PDF en Storage + registro en `documentos`
   - `generar_plan` → `generarYGuardarDocumento("propuesta", datos)` → propuesta/plan PDF
   - `enviar_cobro` → `whatsappService.send()` + email vía Resend (`safeSendEmail`)
4. Marca evento `leido=true`. Tú lo ves en el CRM y en tu correo.

## Por qué así
- El CRM vive en Vercel (público): no puede llamar directo a Hermes (local). El "puente" es la tabla `crm_events` (ya existía).
- La IA dentro del CRM sigue siendo Gemini (FloatingAI + `app/services/ai.ts`), con Edge Function proxy opcional.
- Todo lo que pidas en el chat yo lo puedo insertar como evento sin abrir el CRM.

## Estado
- Handlers registrados en `app/root.tsx` ✅ (verificado con build)
- Falta: workflow n8n (opcional) para automatizar por horario/webhook + token WhatsApp Meta para envíos sin abrir `wa.me`
