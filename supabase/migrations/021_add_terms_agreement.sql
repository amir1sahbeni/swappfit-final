-- ============================================================
-- Migration 021: Add Terms Agreement fields to profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agreed_to_terms_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version       text DEFAULT '1.0';
