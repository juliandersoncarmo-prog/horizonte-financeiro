-- Isolated environment only. Export/reconcile first if any new data exists.
BEGIN;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.credit_cards) OR EXISTS(SELECT 1 FROM public.card_invoices) THEN
    RAISE EXCEPTION 'Rollback blocked: export and reconcile cards/invoices before removing schema';
  END IF;
END $$;
DROP FUNCTION public.create_credit_card(text,integer,jsonb);
DROP TABLE public.card_invoices;
DROP TABLE public.credit_cards;
COMMIT;
