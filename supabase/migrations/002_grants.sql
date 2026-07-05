-- ============================================================
-- Fix: Grant Permissions to API Roles
-- Run this in the Supabase SQL Editor
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON TABLE public.profiles TO anon, authenticated;
GRANT ALL ON TABLE public.listings TO anon, authenticated;
GRANT ALL ON TABLE public.swap_proposals TO anon, authenticated;
GRANT ALL ON TABLE public.conversations TO anon, authenticated;
GRANT ALL ON TABLE public.messages TO anon, authenticated;
GRANT ALL ON TABLE public.notifications TO anon, authenticated;
GRANT ALL ON TABLE public.reviews TO anon, authenticated;

-- Also grant usage on sequences if any were implicitly created
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
