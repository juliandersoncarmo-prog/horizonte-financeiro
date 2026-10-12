-- TEST ONLY: export daily_actuals and marked expenses first.
-- Block rollback while new semantics have financial data; never silently discard it.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.daily_actuals)
    OR EXISTS (SELECT 1 FROM public.transactions WHERE incluido_diario)
    OR EXISTS (SELECT 1 FROM public.recurring_rules WHERE incluido_diario) THEN
    RAISE EXCEPTION 'Reconcile and preserve new financial records before rollback';
  END IF;
END $$;
DROP TABLE public.daily_actuals;
ALTER TABLE public.transactions DROP CONSTRAINT transactions_diario_saida;
ALTER TABLE public.recurring_rules DROP CONSTRAINT recurring_diario_saida;
ALTER TABLE public.transactions DROP COLUMN incluido_diario;
ALTER TABLE public.recurring_rules DROP COLUMN incluido_diario;
COMMIT;
