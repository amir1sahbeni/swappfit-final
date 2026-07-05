-- Add confirmation tracking columns to purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS buyer_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create function to increment swap count
CREATE OR REPLACE FUNCTION increment_swap_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET swap_count = swap_count + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
