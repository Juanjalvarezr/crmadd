-- ============================================================
-- CRM DESEO DIGITAL - Inbox RLS para usuarios autenticados
-- Las politicas originales (20261110000000) son solo TO anon.
-- El CRM logueado usa el rol authenticated -> RLS lo bloqueaba
-- y el inbox no cargaba mensajes. Agregamos politicas authenticated.
-- Ejecutar en Supabase SQL Editor (proyecto fumubmlcaabyrbzsthmt).
-- ============================================================

DROP POLICY IF EXISTS auth_all_channels ON public.channels;
CREATE POLICY auth_all_channels ON public.channels FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_all_channel_contacts ON public.channel_contacts;
CREATE POLICY auth_all_channel_contacts ON public.channel_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_all_conversations ON public.conversations;
CREATE POLICY auth_all_conversations ON public.conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_all_conversation_messages ON public.conversation_messages;
CREATE POLICY auth_all_conversation_messages ON public.conversation_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_all_webhook_events_log ON public.webhook_events_log;
CREATE POLICY auth_all_webhook_events_log ON public.webhook_events_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_all_message_templates ON public.message_templates;
CREATE POLICY auth_all_message_templates ON public.message_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_all_opt_out ON public.opt_out;
CREATE POLICY auth_all_opt_out ON public.opt_out FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
