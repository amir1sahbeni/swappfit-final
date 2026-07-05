-- 010_delete_for_me.sql
-- Adds per-user soft-delete support to messages.
-- A user can hide a message only for themselves; the other party still sees it.

-- 1. Add the column ---------------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS deleted_for uuid[] DEFAULT '{}';

-- GIN index so filtering "not in deleted_for" stays fast as arrays grow
CREATE INDEX IF NOT EXISTS messages_deleted_for_idx
  ON public.messages USING GIN (deleted_for);

-- 2. Atomic append function -------------------------------------------------
-- Called from the client as supabase.rpc('message_delete_for_me', { msg_id: '...' })
-- Uses a single UPDATE so there is no client-side read-modify-write race condition.
CREATE OR REPLACE FUNCTION public.message_delete_for_me(msg_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER           -- runs as owner so it can enforce its own checks
SET search_path = public
AS $$
BEGIN
  -- Guard: caller must be a participant in the conversation that owns this message
  IF NOT EXISTS (
    SELECT 1
    FROM   public.messages m
    JOIN   public.conversations c ON c.id = m.conversation_id
    WHERE  m.id = msg_id
      AND  (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorised to modify this message';
  END IF;

  -- Atomic append: array_append is a single SQL expression, no race window
  UPDATE public.messages
  SET    deleted_for = array_append(deleted_for, auth.uid())
  WHERE  id = msg_id
    AND  NOT (deleted_for @> ARRAY[auth.uid()]);   -- idempotent: skip if already present
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.message_delete_for_me(uuid) TO authenticated;
