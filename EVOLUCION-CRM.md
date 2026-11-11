# EVOLUCIÓN CRM DESEO DIGITAL — Comparativa y Roadmap

Fecha: 2026-11-10
Objetivo: evolución continua del CRM propio, sin romper lo que ya funciona.
Referencias: Kommo (inbox unificado) y DeskcommCRM (robustez multi-canal).

---

## 1. Nuestro CRM hoy (verificado en repo + código)

- Stack: React 19, React Router v7, Vite 6, MUI, Supabase, Vercel.
- 21 rutas: dashboard, clientes, proyectos, tareas, facturacion, cotizaciones,
  contratos, documentos, calendario, kanban, ventas, reportes, email-marketing,
  equipo, prospectos, servicios, chatbot, configuracion, login, public.
- 30+ tablas: clientes, proyectos, tareas, facturas, cotizaciones, contratos,
  documentos, oportunidades, interacciones, crm_events, campanas_email,
  plantillas_email, reglas_negocio_ai, prompts_ai, equipo, transacciones, etc.
- WhatsApp HOY: solo links `wa.me` (whatsappService.ts) + UI de chat
  (ChatbotWhatsApp.tsx con Supabase Realtime). NO hay API real de envío/recepción.
- n8n: flujo de eventos (crm_events -> PDF -> notificaciones).
- IA: Gemini proxy + CerebroAITab + FloatingAIAssistant (aislada del chat).
- Auth real + recovery + RBAC + RLS + PDF + PWA + Ctrl+K + dashboard facturas.

## 2. Kommo (referencia: inbox unificado)

- Inbox unificado: WhatsApp, Instagram, Messenger, Telegram, email, llamadas.
- Lead card automática por conversación (historial + contacto en un solo lugar).
- Pipeline + Digital Pipeline (automatizaciones por etapa).
- Salesbot no-code (saludo, calificación, follow-up 24/7).
- Plantillas, tags, analítica por canal, trabajo en equipo.

## 3. DeskcommCRM (referencia: robustez)

- Capability matrix por canal (un solo archivo, sin `if` de provider).
- Webhook ingestion: raw log -> 2 validaciones -> idempotencia -> 503/Retry-After
  -> cron de replay.
- Upserts atómicos de contacto/conversación por RPC (evita duplicados).
- Identidad `@lid` vs teléfono (WAHA).
- Pacing anti-ban (ledger + jitter + warm-up) y opt-out de 2 niveles.
- 3 tipos de plantilla: quick-replies, copy de campaña, plantillas aprobadas Meta.
- Optimistic UI + ack + watchdog de mensajes atascadas.

## 4. Brechas (qué nos falta)

| Capacidad | Nuestro CRM | Kommo | DeskcommCRM |
|---|---|---|---|
| Inbox unificado multi-canal | No (chat aislado) | Sí | Sí |
| Ingesta real de WhatsApp | No (solo wa.me) | Sí | Sí |
| Lead auto por conversación | No | Sí | Sí |
| Plantillas de WhatsApp | No | Sí | Sí |
| Automatización de chats | n8n básico | Sí (Salesbot) | Sí |
| Pacing anti-ban | No | — | Sí |
| Opt-out | No | — | Sí |
| Multi-canal (Meta / IG) | No | Sí | Parcial |
| IA dentro de la conversación | No (aislada) | Sí | Sí |
| RBAC / RLS / PDF / PWA | Sí | — | Sí |

Conclusión: no hace falta migrar a DeskcommCRM. Nos queda construir el
**inbox unificado** y la **ingesta real**, que es justo lo que Kommo hace bien.

## 5. Arquitectura objetivo (inbox unificado)

- Un solo inbox para ver y responder conversaciones de todos los canales.
- Motores: OpenWA (WhatsApp, ya corriendo en localhost:2785) + Meta Cloud API.
- Datos nuevos (aditivos, no rompen nada):
  - `channels` — canales conectados.
  - `channel_contacts` — contacto por canal.
  - `conversations` — hilo por contacto/canal.
  - `conversation_messages` — mensajes.
  - `webhook_events_log` — raw log append-only (auditoría + replay).
  - `message_templates` — quick-replies / campaña / aprobadas Meta.
  - `opt_out` — lista de exclusión.
- Ingesta (patrón DeskcommCRM):
  webhook -> raw log -> validación -> idempotencia (unique org+external_id)
  -> upsert contacto/conversación -> insert mensaje -> emite evento.
- Salida: adapter por canal (capability matrix). Pacing + opt-out antes de enviar.
- Automatización: n8n + Supabase + IA (respuestas, enrutamiento, follow-up).

## 6. Roadmap (fases no-break)

- Fase 0: Este documento + arquitectura. (actual)
- Fase 1: Datos — tablas nuevas + RLS. Aditivo, sin tocar rutas.
- Fase 2: Ingesta OpenWA — webhook -> Supabase (raw log, idempotencia, upsert).
- Fase 3: Inbox UI — nueva ruta `/inbox` (no se toca `/chatbot`).
- Fase 4: Salida — enviar desde el inbox + pacing + opt-out.
- Fase 5: Plantillas + automatización + IA en la conversación.
- Fase 6: Segundo canal — Meta Cloud API / Instagram.
- Fase 7: UX/UI continuo (mobile-first, compacto).

## 7. Principios de evolución continua

- Una fase a la vez: build + deploy + verificación en producción.
- Cambios aditivos: tablas y rutas nuevas; nunca reescribir rutas existentes.
- Si algo falla: rollback quirúrgico (git restore), nunca parches sobre parches.
- Verificar schema real en Supabase antes de escribir SQL (information_schema).
- Evidencia por fase: git status, diff, build, check de producción.

## 8. Primer paso concreto (Fase 1)

1. Verificar tablas existentes en Supabase (information_schema).
2. Crear `sql/add-inbox-tables.sql` con las tablas + RLS + índices.
3. Ejecutar en Supabase (método a confirmar: dashboard SQL o `supabase db push`).
4. Verificar conteos y permisos.
5. Build + deploy (no toca rutas, pero confirmar que nada se rompe).
