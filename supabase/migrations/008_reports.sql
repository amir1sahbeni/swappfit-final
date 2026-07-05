-- 008_reports.sql
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason text NOT NULL,
    details text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports."
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);
