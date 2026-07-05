-- 007_message_overhaul.sql
ALTER TABLE public.messages 
ADD COLUMN reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN reactions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN deleted_at TIMESTAMPTZ;

-- Allow update of reactions and deleted_at
CREATE POLICY "Users can update messages in their conversations" ON public.messages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
  )
);
