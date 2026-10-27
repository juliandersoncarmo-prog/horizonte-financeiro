BEGIN;
-- Existing expenses keep their exact totals; only new decisions acquire coverage.
ALTER TABLE public.daily_expenses ADD COLUMN included_amount numeric(15,2) NOT NULL DEFAULT 0 CHECK (included_amount>=0 AND included_amount<=amount);
CREATE TABLE public.budget_expense_categories (
 user_id uuid NOT NULL REFERENCES auth.users(id), budget_id uuid PRIMARY KEY REFERENCES public.daily_budgets(id) ON DELETE CASCADE,
 category_id uuid NOT NULL, FOREIGN KEY(user_id,category_id) REFERENCES public.expense_categories(user_id,id)
);
CREATE INDEX budget_expense_categories_owner ON public.budget_expense_categories(user_id,category_id);
ALTER TABLE public.budget_expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_expense_categories_owner ON public.budget_expense_categories FOR ALL TO authenticated
 USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id AND EXISTS(SELECT 1 FROM public.daily_budgets b WHERE b.id=budget_id AND b.user_id=(select auth.uid())));
REVOKE ALL ON public.budget_expense_categories FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.budget_expense_categories TO authenticated;
ALTER TABLE public.expense_categories DROP CONSTRAINT expense_categories_name_check;
ALTER TABLE public.expense_categories ADD CONSTRAINT expense_categories_name_check CHECK(length(btrim(name)) BETWEEN 1 AND 200);
INSERT INTO public.expense_categories(user_id,name)
 SELECT DISTINCT ON(user_id,lower(btrim(descricao))) user_id,btrim(descricao) FROM public.daily_budgets WHERE length(btrim(descricao)) BETWEEN 1 AND 200
 ON CONFLICT(user_id,lower(btrim(name))) DO NOTHING;
INSERT INTO public.budget_expense_categories(user_id,budget_id,category_id)
 SELECT b.user_id,b.id,c.id FROM public.daily_budgets b JOIN public.expense_categories c ON c.user_id=b.user_id AND lower(btrim(c.name))=lower(btrim(b.descricao));
CREATE FUNCTION public.sync_budget_expense_category() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE previous uuid; target uuid;
BEGIN
 IF auth.uid() IS NULL OR NEW.user_id<>auth.uid() THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 SELECT category_id INTO previous FROM public.budget_expense_categories WHERE budget_id=NEW.id AND user_id=auth.uid();
 SELECT id INTO target FROM public.expense_categories WHERE user_id=auth.uid() AND lower(btrim(name))=lower(btrim(NEW.descricao));
 IF target IS NULL THEN
  IF previous IS NOT NULL THEN
   UPDATE public.expense_categories SET name=btrim(NEW.descricao) WHERE id=previous AND user_id=auth.uid(); target:=previous;
  ELSE
   INSERT INTO public.expense_categories(user_id,name) VALUES(auth.uid(),btrim(NEW.descricao)) RETURNING id INTO target;
  END IF;
 ELSIF previous IS NOT NULL AND previous<>target THEN
  -- Rename collision: merge identities without touching amounts or realized totals.
  UPDATE public.daily_expenses SET category_id=target WHERE user_id=auth.uid() AND category_id=previous;
  UPDATE public.budget_expense_categories SET category_id=target WHERE user_id=auth.uid() AND category_id=previous;
  DELETE FROM public.expense_categories WHERE id=previous AND user_id=auth.uid();
 END IF;
 INSERT INTO public.budget_expense_categories(user_id,budget_id,category_id) VALUES(auth.uid(),NEW.id,target)
 ON CONFLICT(budget_id) DO UPDATE SET category_id=excluded.category_id;
 RETURN NULL;
END $$;
CREATE TRIGGER budget_expense_category_sync AFTER INSERT OR UPDATE OF descricao ON public.daily_budgets FOR EACH ROW EXECUTE FUNCTION public.sync_budget_expense_category();
REVOKE ALL ON FUNCTION public.sync_budget_expense_category() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sync_budget_expense_category() TO authenticated;

-- Coverage is returned to the manual remainder on deletion/move/decrease. Therefore
-- deleting an included item removes its detail, not the already-confirmed spending.
CREATE FUNCTION public.adjust_expense_coverage() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE available numeric;
BEGIN
 IF TG_OP<>'INSERT' AND OLD.included_amount>0 THEN
  UPDATE public.daily_expense_days SET manual_adjustment=coalesce(manual_adjustment,0)+OLD.included_amount WHERE user_id=auth.uid() AND expense_date=OLD.expense_date;
 END IF;
 IF TG_OP<>'DELETE' AND NEW.included_amount>0 THEN
  SELECT coalesce(manual_adjustment,0) INTO available FROM public.daily_expense_days WHERE user_id=auth.uid() AND expense_date=NEW.expense_date FOR UPDATE;
  IF available IS NULL OR NEW.included_amount>available THEN RAISE EXCEPTION 'Os gastos incluídos ultrapassam o total informado. Confirme o valor adicional.'; END IF;
  UPDATE public.daily_expense_days SET manual_adjustment=manual_adjustment-NEW.included_amount WHERE user_id=auth.uid() AND expense_date=NEW.expense_date;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
-- PostgreSQL runs triggers of a given kind by name: lock owner before coverage.
CREATE TRIGGER expense_z_coverage BEFORE INSERT OR UPDATE OR DELETE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION public.adjust_expense_coverage();
REVOKE ALL ON FUNCTION public.adjust_expense_coverage() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.adjust_expense_coverage() TO authenticated;

CREATE OR REPLACE FUNCTION public.save_daily_expense(p_id uuid,p_description text,p_amount numeric,p_category uuid,p_date date,p_reconcile text DEFAULT NULL,p_expected timestamptz DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE existing public.daily_expenses; dayrow public.daily_expense_days; total numeric; remaining numeric; delta numeric; coverage numeric:=0; choice text; needs_choice boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 IF p_date IS NULL OR NOT isfinite(p_date) OR p_date<'1900-01-01' OR p_date>'9999-12-31'
 OR p_amount IS NULL OR p_amount<=0 OR p_amount>999999999 OR p_amount<>round(p_amount,2)
 OR p_description IS NULL OR length(btrim(p_description)) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Gasto inválido'; END IF;
 SELECT * INTO existing FROM public.daily_expenses WHERE id=p_id AND user_id=auth.uid();
 IF FOUND AND p_expected IS NULL THEN RETURN existing.id; END IF;
 IF p_expected IS NOT NULL AND (existing.id IS NULL OR existing.updated_at<>p_expected) THEN RAISE EXCEPTION 'Este gasto mudou. Recarregue antes de editar.'; END IF;
 SELECT valor INTO total FROM public.daily_actuals WHERE user_id=auth.uid() AND data=p_date;
 SELECT * INTO dayrow FROM public.daily_expense_days WHERE user_id=auth.uid() AND expense_date=p_date;
 remaining:=CASE WHEN dayrow.user_id IS NULL THEN coalesce(total,0) ELSE coalesce(dayrow.manual_adjustment,0) END;
 delta:=p_amount;
 IF existing.id IS NOT NULL AND existing.expense_date=p_date THEN
  delta:=p_amount-existing.amount; coverage:=least(existing.included_amount,p_amount);
 END IF;
 needs_choice:=delta>0 AND (remaining>0 OR coverage>0);
 IF needs_choice THEN
  choice:=split_part(coalesce(p_reconcile,''),':',1);
  IF choice NOT IN ('included','additional') OR p_reconcile IS DISTINCT FROM choice||':'||coalesce(total,0)::text||':'||remaining::text THEN
   RAISE EXCEPTION 'RECONCILE_REQUIRED' USING DETAIL=json_build_object('total',coalesce(total,0),'remaining',remaining,'delta',delta)::text;
  END IF;
  IF choice='included' THEN
   IF delta>remaining THEN RAISE EXCEPTION 'RECONCILE_REQUIRED' USING DETAIL=json_build_object('total',coalesce(total,0),'remaining',remaining,'delta',delta)::text; END IF;
   coverage:=coverage+delta;
  END IF;
 END IF;
 IF dayrow.user_id IS NULL THEN
  INSERT INTO public.daily_expense_days(user_id,expense_date,manual_adjustment,legacy_actual) VALUES(auth.uid(),p_date,total,total);
 END IF;
 IF existing.id IS NULL THEN
  INSERT INTO public.daily_expenses(id,user_id,description,amount,category_id,expense_date,included_amount) VALUES(p_id,auth.uid(),btrim(p_description),p_amount,p_category,p_date,coverage);
 ELSE
  UPDATE public.daily_expenses SET description=btrim(p_description),amount=p_amount,category_id=p_category,expense_date=p_date,included_amount=coverage WHERE id=p_id AND user_id=auth.uid();
 END IF;
 RETURN p_id;
END $$;
COMMIT;
