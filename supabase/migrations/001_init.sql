-- ============================================================
-- SwappFit — Initial Database Migration
-- Apply via Supabase SQL Editor or psql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

-- Profiles (extends auth.users, created automatically on signup)
CREATE TABLE IF NOT EXISTS public.profiles (
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text        NOT NULL DEFAULT '',
  handle         text        UNIQUE,
  avatar_url     text,
  bio            text        DEFAULT '',
  location       text        DEFAULT '',
  rating         numeric(3,2) DEFAULT 0,
  review_count   integer     DEFAULT 0,
  swap_count     integer     DEFAULT 0,
  saved_listings uuid[]      DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Listings
CREATE TABLE IF NOT EXISTS public.listings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  brand       text        DEFAULT '',
  size        text        DEFAULT '',
  price       integer     NOT NULL DEFAULT 0,   -- cents
  description text        DEFAULT '',
  category    text        NOT NULL,
  condition   text        NOT NULL,
  images      text[]      DEFAULT '{}',
  status      text        DEFAULT 'active',      -- active | swapped | removed
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Swap proposals
CREATE TABLE IF NOT EXISTS public.swap_proposals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id     uuid        NOT NULL REFERENCES public.profiles(id),
  receiver_id     uuid        NOT NULL REFERENCES public.profiles(id),
  offered_item_id uuid        NOT NULL REFERENCES public.listings(id),
  wanted_item_id  uuid        NOT NULL REFERENCES public.listings(id),
  note            text        DEFAULT '',
  status          text        DEFAULT 'pending', -- pending | accepted | declined | completed
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a    uuid        NOT NULL REFERENCES public.profiles(id),
  participant_b    uuid        NOT NULL REFERENCES public.profiles(id),
  listing_id       uuid        REFERENCES public.listings(id),
  proposal_id      uuid        REFERENCES public.swap_proposals(id),
  last_message     text        DEFAULT '',
  last_message_at  timestamptz DEFAULT now(),
  deleted_for      uuid[]      DEFAULT '{}',
  created_at       timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES public.profiles(id),
  text            text        NOT NULL,
  read            boolean     DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id),
  type       text        NOT NULL,   -- swap | message | rating | like
  actor_id   uuid        REFERENCES public.profiles(id),
  entity_id  uuid,
  text       text        NOT NULL,
  read       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  uuid        NOT NULL REFERENCES public.profiles(id),
  reviewee_id  uuid        NOT NULL REFERENCES public.profiles(id),
  proposal_id  uuid        REFERENCES public.swap_proposals(id),
  rating       integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags         text[]      DEFAULT '{}',
  body         text        DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS listings_seller_id_idx    ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS listings_status_idx       ON public.listings(status);
CREATE INDEX IF NOT EXISTS listings_category_idx     ON public.listings(category);
CREATE INDEX IF NOT EXISTS listings_created_at_idx   ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_conv_id_idx      ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx   ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS proposals_proposer_idx    ON public.swap_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS proposals_receiver_idx    ON public.swap_proposals(receiver_id);

-- ─────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────

-- Auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_handle text;
  final_handle text;
  counter integer := 0;
BEGIN
  base_handle := '@' || LOWER(
    REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'name', 'user'),
      '[^a-z0-9]', '', 'g'
    )
  );
  -- Make handle unique by appending a short suffix if needed
  final_handle := base_handle || SUBSTRING(NEW.id::text, 1, 4);

  INSERT INTO public.profiles (id, name, handle, governorate, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'governorate', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update profiles.updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS listings_updated_at ON public.listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_proposals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listings
CREATE POLICY "listings_select_all"
  ON public.listings FOR SELECT USING (true);

CREATE POLICY "listings_insert_own"
  ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "listings_update_own"
  ON public.listings FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "listings_delete_own"
  ON public.listings FOR DELETE USING (auth.uid() = seller_id);

-- Swap proposals
CREATE POLICY "proposals_select_participants"
  ON public.swap_proposals FOR SELECT
  USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

CREATE POLICY "proposals_insert_proposer"
  ON public.swap_proposals FOR INSERT
  WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "proposals_update_participants"
  ON public.swap_proposals FOR UPDATE
  USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

-- Conversations
CREATE POLICY "conversations_select_participants"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "conversations_insert_participants"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "conversations_update_participants"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "conversations_delete_participants"
  ON public.conversations FOR DELETE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Messages
CREATE POLICY "messages_select_participants"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

CREATE POLICY "messages_insert_participants"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- Notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_any_authenticated"
  ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reviews
CREATE POLICY "reviews_select_all"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ─────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images',
  'item-images',
  true,
  5242880,   -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,   -- 2 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "item_images_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'item-images');

CREATE POLICY "item_images_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "item_images_auth_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "item_images_auth_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_auth_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
G R A N T   U S A G E   O N   S C H E M A   p u b l i c   T O   a n o n ,   a u t h e n t i c a t e d ;   G R A N T   A L L   O N   T A B L E   p u b l i c . p r o f i l e s   T O   a n o n ,   a u t h e n t i c a t e d ;   G R A N T   A L L   O N   T A B L E   p u b l i c . l i s t i n g s   T O   a n o n ,   a u t h e n t i c a t e d ;   G R A N T   A L L   O N   T A B L E   p u b l i c . s w a p _ p r o p o s a l s   T O   a n o n ,   a u t h e n t i c a t e d ;   G R A N T   A L L   O N   T A B L E   p u b l i c . c o n v e r s a t i o n s   T O   a n o n ,   a u t h e n t i c a t e d ;   G R A N T   A L L   O N   T A B L E   p u b l i c . m e s s a g e s   T O   a n o n ,   a u t h e n t i c a t e d ;   G R A N T   A L L   O N   T A B L E   p u b l i c . n o t i f i c a t i o n s   T O   a n o n ,   a u t h e n t i c a t e d ;   G R A N T   A L L   O N   T A B L E   p u b l i c . r e v i e w s   T O   a n o n ,   a u t h e n t i c a t e d ; 
 
 