-- 011_replica_identity.sql
-- Without REPLICA IDENTITY FULL, Supabase Realtime UPDATE events do not carry
-- the old-row column values needed to match client-side filters like
-- `conversation_id=eq.<id>`. This means partners never receive the UPDATE
-- broadcast when a message's deleted_at (or deleted_for) changes.
-- Setting FULL ensures the complete old row is included in every WAL record,
-- so filtered realtime subscriptions work correctly for UPDATE events.

ALTER TABLE public.messages REPLICA IDENTITY FULL;
