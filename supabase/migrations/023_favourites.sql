CREATE TABLE public.favourites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own favourites"
  ON public.favourites
  FOR ALL
  USING (auth.uid() = user_id);
