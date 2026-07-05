-- ============================================================
-- SwappFit — Follows Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.follows (
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone."
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others."
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others."
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);
