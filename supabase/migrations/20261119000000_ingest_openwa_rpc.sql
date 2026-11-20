-- ============================================================
-- CRM DESEO DIGITAL - Fase 2 Ingesta inbound OpenWA (RPC atomica)
-- Upsert atomico de contacto/conversacion + insert mensaje + auditoria.
-- Idempotente por external_id (waMessageId). Patron DeskcommCRM.
-- ============================================================

CREATE OR REPLACE FUNCTION public.ingest_openwa_message(m jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_external_id text;
  v_chat_id text;
  v_phone text;
  v_nombre text;
  v_body text;
  v_tipo text;
  v_ts timestamptz;
  v_channel_id bigint := 1;
  v_contact_id bigint;
  v_conv_id bigint;
  v_msg_id bigint;
BEGIN
  v_external_id := m->>'waMessageId';
  v_chat_id := m->>'chatId';
  v_phone := regexp_replace(coalesce(m->>'from', v_chat_id, ''), '\D', '', 'g');
  v_nombre := m->>'chatName';
  v_body := coalesce(m->>'body', '');
  v_tipo := coalesce(m->>'type', 'texto');
  v_ts := to_timestamp(coalesce((m->>'timestamp')::bigint, extract(epoch from now())::bigint));

  IF v_external_id IS NULL OR v_external_id = '' THEN
    RETURN jsonb_build_object('status','error','reason','sin waMessageId');
  END IF;

  -- Idempotencia: si ya existe el mensaje, skip
  SELECT id INTO v_msg_id FROM public.conversation_messages WHERE external_id = v_external_id LIMIT 1;
  IF v_msg_id IS NOT NULL THEN
    RETURN jsonb_build_object('status','skipped','message_id',v_msg_id);
  END IF;

  IF v_phone = '' THEN
    RETURN jsonb_build_object('status','error','reason','sin telefono');
  END IF;

  -- Upsert contacto (external_id = telefono normalizado, igual que outbound)
  INSERT INTO public.channel_contacts (channel_id, external_id, nombre, telefono, metadata, actualizado_en)
  VALUES (v_channel_id, v_phone, v_nombre, v_phone,
          jsonb_build_object('pushName', v_nombre, 'chatId', v_chat_id), now())
  ON CONFLICT (channel_id, external_id) DO UPDATE SET
    nombre = coalesce(excluded.nombre, public.channel_contacts.nombre),
    telefono = coalesce(excluded.telefono, public.channel_contacts.telefono),
    actualizado_en = now()
  RETURNING id INTO v_contact_id;

  -- Get or create conversacion
  SELECT id INTO v_conv_id FROM public.conversations
    WHERE channel_id = v_channel_id AND contact_id = v_contact_id LIMIT 1;
  IF v_conv_id IS NULL THEN
    INSERT INTO public.conversations (channel_id, contact_id, estado, ultimo_mensaje, ultimo_mensaje_en)
    VALUES (v_channel_id, v_contact_id, 'abierta', v_body, v_ts)
    RETURNING id INTO v_conv_id;
  ELSE
    UPDATE public.conversations
      SET ultimo_mensaje = v_body, ultimo_mensaje_en = v_ts, actualizado_en = now()
      WHERE id = v_conv_id;
  END IF;

  -- Insert mensaje inbound
  INSERT INTO public.conversation_messages
    (conversation_id, external_id, direccion, tipo, cuerpo, estado, enviado_por, creado_en)
  VALUES (v_conv_id, v_external_id, 'inbound', v_tipo, v_body, 'recibido', m->>'from', v_ts)
  RETURNING id INTO v_msg_id;

  -- Auditoria raw log
  INSERT INTO public.webhook_events_log (canal, external_id, raw, status, procesado_en)
  VALUES ('openwa', v_external_id, m, 'processed', now());

  RETURN jsonb_build_object('status','inserted','message_id',v_msg_id,'conversation_id',v_conv_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ingest_openwa_message(jsonb) TO anon, authenticated, service_role;
