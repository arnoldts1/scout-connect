-- Camp Templates for autofill
CREATE TABLE IF NOT EXISTS public.camp_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,
  is_trending   BOOLEAN DEFAULT FALSE,
  template_data JSONB DEFAULT '{}',
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.camp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camp_templates_select" ON public.camp_templates FOR SELECT USING (TRUE);
CREATE POLICY "camp_templates_insert" ON public.camp_templates FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "camp_templates_update" ON public.camp_templates FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "camp_templates_delete" ON public.camp_templates FOR DELETE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
