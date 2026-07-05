-- ============================================================
-- SwappFit — Add Profile Search Indexes
-- ============================================================

-- Add indexes for efficient user search by handle and name
CREATE INDEX IF NOT EXISTS profiles_handle_idx ON public.profiles(handle);
CREATE INDEX IF NOT EXISTS profiles_name_idx ON public.profiles(name);

-- Add a composite index for combined searches
CREATE INDEX IF NOT EXISTS profiles_handle_name_idx ON public.profiles(handle, name);
