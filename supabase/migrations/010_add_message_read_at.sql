-- Add read_at timestamp to messages table for tracking when messages are read
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Create index on read_at for efficient queries
CREATE INDEX IF NOT EXISTS messages_read_at_idx ON public.messages(read_at);
