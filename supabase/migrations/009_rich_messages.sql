-- Add message_type and media columns to messages table
ALTER TABLE public.messages 
ADD COLUMN message_type TEXT DEFAULT 'text',
ADD COLUMN media_url TEXT,
ADD COLUMN media_metadata JSONB;

-- Create chat-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up basic storage policies for chat-media (allow authenticated uploads/reads)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-media');

CREATE POLICY "Auth Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');
