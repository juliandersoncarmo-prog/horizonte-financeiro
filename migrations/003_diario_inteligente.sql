-- Apply ONLY to an isolated Supabase test project after checking its schema.
BEGIN;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS incluido_diario boolean NOT NULL DEFAULT false;
ALTER TABLE public.recurring_rules ADD COLUMN IF NOT EXISTS incluido_diario boolean NOT NULL DEFAULT false;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_diario_saida CHECK (NOT incluido_diario OR tipo = 'saida');
ALTER TABLE public.recurring_rules ADD CONSTRAINT recurring_diario_saida CHECK (NOT incluido_diario OR tipo = 'saida');
CREATE TABLE public.daily_actuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  data date NOT NULL,
  valor numeric(15,2) NOT NULL CHECK (valor >= 0 AND valor <= 999999999),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, data)
);
ALTER TABLE public.daily_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY daily_actuals_owner ON public.daily_actuals FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_actuals TO authenticated;
COMMIT;
