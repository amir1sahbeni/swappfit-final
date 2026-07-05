-- Add 'purchase' to NotificationType enum if it exists, but typically it's just a string in our types.
-- Assuming notification 'type' is a string.
CREATE EXTENSION IF NOT EXISTS moddatetime schema extensions;

CREATE TYPE purchase_status AS ENUM ('pending_delivery', 'completed', 'cancelled');

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status purchase_status NOT NULL DEFAULT 'pending_delivery',
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Policies for purchases
CREATE POLICY "Users can view their own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert purchases as buyer"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own purchases"
  ON public.purchases FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Policies for purchase_items
CREATE POLICY "Users can view their own purchase_items"
  ON public.purchase_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.purchases 
      WHERE purchases.id = purchase_items.purchase_id 
      AND (purchases.buyer_id = auth.uid() OR purchases.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own purchase_items"
  ON public.purchase_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchases 
      WHERE purchases.id = purchase_items.purchase_id 
      AND purchases.buyer_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE TRIGGER handle_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime (updated_at);
