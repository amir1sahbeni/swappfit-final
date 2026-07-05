-- PASTE THIS ENTIRE BLOCK INTO SUPABASE SQL EDITOR AND RUN IT
-- Adds every missing column + policies + RPC in one shot (safe to re-run)

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactions           JSONB       DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS message_type        TEXT        DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url           TEXT,
  ADD COLUMN IF NOT EXISTS media_metadata      JSONB,
  ADD COLUMN IF NOT EXISTS deleted_for         UUID[]      DEFAULT '{}';

CREATE INDEX IF NOT EXISTS messages_deleted_for_idx
  ON public.messages USING GIN (deleted_for);

ALTER TABLE public.messages REPLICA IDENTITY FULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can update messages in their conversations') THEN
    EXECUTE $p$ CREATE POLICY "Users can update messages in their conversations" ON public.messages FOR UPDATE USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid()))); $p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='messages_fk_lookup') THEN
    EXECUTE $p$ CREATE POLICY "messages_fk_lookup" ON public.messages FOR SELECT USING (auth.role() = 'authenticated'); $p$;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.message_delete_for_me(msg_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.messages m JOIN public.conversations c ON c.id = m.conversation_id WHERE m.id = msg_id AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  UPDATE public.messages SET deleted_for = array_append(deleted_for, auth.uid()) WHERE id = msg_id AND NOT (deleted_for @> ARRAY[auth.uid()]);
END; $$;

GRANT EXECUTE ON FUNCTION public.message_delete_for_me(uuid) TO authenticated;
