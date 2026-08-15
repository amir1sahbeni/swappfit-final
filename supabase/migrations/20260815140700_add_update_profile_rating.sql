CREATE OR REPLACE FUNCTION public.update_profile_rating(p_user_id UUID, p_rating NUMERIC, p_review_count INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET rating = p_rating,
      review_count = p_review_count
  WHERE id = p_user_id;
END;
$$;
