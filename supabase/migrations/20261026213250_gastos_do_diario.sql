-- Additive migration. Apply after migrations/000..009 in an isolated database first.
BEGIN;
CREATE TABLE public.expense_categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 60),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,id)
);
CREATE UNIQUE INDEX expense_categories_owner_name ON public.expense_categories(user_id,lower(btrim(name)));
CREATE TABLE public.daily_expense_days (
 user_id uuid NOT NULL REFERENCES auth.users(id), expense_date date NOT NULL,
 manual_adjustment numeric(15,2) CHECK (manual_adjustment BETWEEN 0 AND 999999999),
 legacy_actual numeric(15,2), reconciled_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,expense_date)
);
CREATE TABLE public.daily_expenses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 200),
 amount numeric(15,2) NOT NULL CHECK (amount > 0 AND amount <= 999999999),
 category_id uuid, expense_date date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(user_id,category_id) REFERENCES public.expense_categories(user_id,id),
 FOREIGN KEY(user_id,expense_date) REFERENCES public.daily_expense_days(user_id,expense_date)
);
CREATE INDEX daily_expenses_owner_date ON public.daily_expenses(user_id,expense_date,created_at DESC,id);
CREATE INDEX daily_expenses_owner_category ON public.daily_expenses(user_id,category_id);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_expense_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY expense_categories_owner ON public.expense_categories FOR ALL TO authenticated
 USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
CREATE POLICY daily_expense_days_owner ON public.daily_expense_days FOR ALL TO authenticated
 USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
CREATE POLICY daily_expenses_owner ON public.daily_expenses FOR ALL TO authenticated
 USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
REVOKE ALL ON public.expense_categories,public.daily_expense_days,public.daily_expenses FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.expense_categories,public.daily_expense_days,public.daily_expenses TO authenticated;

-- Serialize all writes for an owner, including direct API writes and the old inline editor.
CREATE FUNCTION public.lock_expense_owner() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR (TG_OP <> 'INSERT' AND OLD.user_id <> auth.uid())
 OR (TG_OP <> 'DELETE' AND NEW.user_id <> auth.uid()) THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF TG_OP='UPDATE' AND TG_TABLE_NAME='daily_expenses' THEN NEW.updated_at:=clock_timestamp(); END IF;
 IF TG_OP='UPDATE' AND TG_TABLE_NAME='daily_expense_days' THEN
  IF NEW.expense_date<>OLD.expense_date OR NEW.legacy_actual IS DISTINCT FROM OLD.legacy_actual THEN RAISE EXCEPTION 'Registro de conciliação imutável'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER expense_lock BEFORE INSERT OR UPDATE OR DELETE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION public.lock_expense_owner();
CREATE TRIGGER expense_day_lock BEFORE INSERT OR UPDATE OR DELETE ON public.daily_expense_days FOR EACH ROW EXECUTE FUNCTION public.lock_expense_owner();

CREATE FUNCTION public.sync_expense_actual(p_date date) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE adjustment numeric; total numeric; n bigint;
BEGIN
 SELECT manual_adjustment INTO adjustment FROM public.daily_expense_days WHERE user_id=auth.uid() AND expense_date=p_date;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT count(*),coalesce(sum(amount),0) INTO n,total FROM public.daily_expenses WHERE user_id=auth.uid() AND expense_date=p_date;
 IF n=0 AND adjustment IS NULL THEN
  DELETE FROM public.daily_actuals WHERE user_id=auth.uid() AND data=p_date;
 ELSE
  INSERT INTO public.daily_actuals(user_id,data,valor) VALUES(auth.uid(),p_date,total+coalesce(adjustment,0))
  ON CONFLICT(user_id,data) DO UPDATE SET valor=excluded.valor;
 END IF;
END $$;
CREATE FUNCTION public.refresh_expense_actual() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF TG_OP <> 'INSERT' THEN PERFORM public.sync_expense_actual(OLD.expense_date); END IF;
 IF TG_OP <> 'DELETE' THEN PERFORM public.sync_expense_actual(NEW.expense_date); END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER expense_refresh AFTER INSERT OR UPDATE OR DELETE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION public.refresh_expense_actual();

-- Old totals remain unchanged until the first explicit reconciliation. Manual editing
-- thereafter changes only the residual adjustment, never the expense items.
CREATE FUNCTION public.protect_expense_actual() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE d date; total numeric;
BEGIN
 IF pg_trigger_depth()>1 THEN
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
 END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 IF TG_OP='DELETE' THEN d:=OLD.data; ELSE d:=NEW.data; END IF;
 IF TG_OP='UPDATE' AND (NEW.data<>OLD.data OR NEW.user_id<>OLD.user_id) THEN RAISE EXCEPTION 'Altere somente o valor realizado'; END IF;
 IF EXISTS(SELECT 1 FROM public.daily_expense_days WHERE user_id=auth.uid() AND expense_date=d) THEN
  SELECT coalesce(sum(amount),0) INTO total FROM public.daily_expenses WHERE user_id=auth.uid() AND expense_date=d;
  IF TG_OP='DELETE' THEN
   IF total>0 THEN RAISE EXCEPTION 'Este dia possui gastos detalhados. Edite ou exclua os gastos em Gastos do Diário.'; END IF;
   DELETE FROM public.daily_expense_days WHERE user_id=auth.uid() AND expense_date=d;
  ELSE
   IF NEW.valor<total THEN RAISE EXCEPTION 'O total não pode ser menor que os gastos detalhados. Edite os itens em Gastos do Diário.'; END IF;
   UPDATE public.daily_expense_days SET manual_adjustment=NEW.valor-total WHERE user_id=auth.uid() AND expense_date=d;
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER daily_actual_expense_guard BEFORE INSERT OR UPDATE OR DELETE ON public.daily_actuals FOR EACH ROW EXECUTE FUNCTION public.protect_expense_actual();

-- Metadata writes through the Data API must also keep the total consistent.
CREATE FUNCTION public.refresh_expense_day() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF pg_trigger_depth()=1 THEN
  IF TG_OP='DELETE' THEN DELETE FROM public.daily_actuals WHERE user_id=auth.uid() AND data=OLD.expense_date;
  ELSE PERFORM public.sync_expense_actual(NEW.expense_date); END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER expense_day_refresh AFTER INSERT OR UPDATE OR DELETE ON public.daily_expense_days FOR EACH ROW EXECUTE FUNCTION public.refresh_expense_day();
REVOKE ALL ON FUNCTION public.refresh_expense_day() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.refresh_expense_day() TO authenticated;

CREATE FUNCTION public.save_daily_expense(p_id uuid,p_description text,p_amount numeric,p_category uuid,p_date date,p_reconcile text DEFAULT NULL,p_expected timestamptz DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE legacy numeric; existing public.daily_expenses;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 IF p_date IS NULL OR NOT isfinite(p_date) OR p_date<'1900-01-01' OR p_date>'9999-12-31'
 OR p_amount IS NULL OR p_amount<=0 OR p_amount>999999999 OR p_amount<>round(p_amount,2)
 OR p_description IS NULL OR length(btrim(p_description)) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Gasto inválido'; END IF;
 SELECT * INTO existing FROM public.daily_expenses WHERE id=p_id AND user_id=auth.uid();
 IF FOUND AND p_expected IS NULL THEN RETURN existing.id; END IF; -- idempotent create retry
 IF p_expected IS NOT NULL AND (existing.id IS NULL OR existing.updated_at<>p_expected) THEN RAISE EXCEPTION 'Este gasto mudou. Recarregue antes de editar.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.daily_expense_days WHERE user_id=auth.uid() AND expense_date=p_date) THEN
  SELECT valor INTO legacy FROM public.daily_actuals WHERE user_id=auth.uid() AND data=p_date;
  IF legacy IS NOT NULL AND (p_reconcile IS NULL OR p_reconcile NOT IN ('preserve','replace')) THEN RAISE EXCEPTION 'RECONCILE_REQUIRED: Este dia possui um total manual. Escolha como conciliá-lo.'; END IF;
  INSERT INTO public.daily_expense_days(user_id,expense_date,manual_adjustment,legacy_actual)
  VALUES(auth.uid(),p_date,CASE WHEN p_reconcile='preserve' THEN legacy ELSE NULL END,legacy);
 END IF;
 IF existing.id IS NULL THEN
  INSERT INTO public.daily_expenses(id,user_id,description,amount,category_id,expense_date)
  VALUES(p_id,auth.uid(),btrim(p_description),p_amount,p_category,p_date);
 ELSE
  UPDATE public.daily_expenses SET description=btrim(p_description),amount=p_amount,category_id=p_category,expense_date=p_date,updated_at=clock_timestamp()
  WHERE id=p_id AND user_id=auth.uid();
 END IF;
 RETURN p_id;
END $$;
CREATE FUNCTION public.delete_daily_expense(p_id uuid,p_expected timestamptz) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 DELETE FROM public.daily_expenses WHERE id=p_id AND user_id=auth.uid() AND updated_at=p_expected;
 IF NOT FOUND THEN RAISE EXCEPTION 'Este gasto mudou ou foi removido. Recarregue a lista.'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.save_daily_expense(uuid,text,numeric,uuid,date,text,timestamptz),public.delete_daily_expense(uuid,timestamptz),public.sync_expense_actual(date),public.refresh_expense_actual(),public.protect_expense_actual(),public.lock_expense_owner() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_daily_expense(uuid,text,numeric,uuid,date,text,timestamptz),public.delete_daily_expense(uuid,timestamptz),public.sync_expense_actual(date),public.refresh_expense_actual(),public.protect_expense_actual(),public.lock_expense_owner() TO authenticated;
COMMIT;
