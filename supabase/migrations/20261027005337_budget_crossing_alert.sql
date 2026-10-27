BEGIN;
-- Additive wrapper: the existing save/concilation routine and triggers stay intact.
-- No durable alert state: crossing is computed from current totals under the same
-- owner lock, so deletion, edits, budget changes and date/category moves rearm it.
CREATE FUNCTION public.save_daily_expense_with_budget_alert(
 p_id uuid,p_description text,p_amount numeric,p_category uuid,p_date date,
 p_reconcile text DEFAULT NULL,p_expected timestamptz DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE before_total numeric; after_total numeric; budget numeric; category_name text;
 month_start date; month_end date; result_id uuid; alert jsonb:=NULL;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 -- Preserve validation and idempotent retries in the original routine.
 month_start:=date_trunc('month',p_date)::date;
 month_end:=(month_start+interval '1 month')::date;
 SELECT coalesce(sum(amount),0) INTO before_total FROM public.daily_expenses
 WHERE user_id=auth.uid() AND category_id=p_category AND expense_date>=month_start AND expense_date<month_end;
 SELECT sum(b.valor_mensal) INTO budget FROM public.daily_budgets b
 JOIN public.budget_expense_categories c ON c.budget_id=b.id AND c.user_id=b.user_id
 WHERE b.user_id=auth.uid() AND c.category_id=p_category
 AND (b.mes_referencia IS NULL OR b.mes_referencia=to_char(p_date,'YYYY-MM'));
 result_id:=public.save_daily_expense(p_id,p_description,p_amount,p_category,p_date,p_reconcile,p_expected);
 IF p_category IS NOT NULL AND budget IS NOT NULL THEN
  SELECT coalesce(sum(amount),0) INTO after_total FROM public.daily_expenses
  WHERE user_id=auth.uid() AND category_id=p_category AND expense_date>=month_start AND expense_date<month_end;
  IF before_total<=budget AND after_total>budget THEN
   SELECT name INTO category_name FROM public.expense_categories WHERE id=p_category AND user_id=auth.uid();
   alert:=jsonb_build_object('category',category_name,'budget',budget,'spent',after_total,
     'exceeded',after_total-budget,'month',to_char(p_date,'YYYY-MM'));
  END IF;
 END IF;
 RETURN jsonb_build_object('id',result_id,'budgetAlert',alert);
END $$;
REVOKE ALL ON FUNCTION public.save_daily_expense_with_budget_alert(uuid,text,numeric,uuid,date,text,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_daily_expense_with_budget_alert(uuid,text,numeric,uuid,date,text,timestamptz) TO authenticated;
COMMIT;
