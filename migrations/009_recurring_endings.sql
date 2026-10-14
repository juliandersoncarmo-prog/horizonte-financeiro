-- Persistent, monotonic cutoff independent of the editable recurrence schedule.
CREATE TABLE public.recurring_endings (
 user_id uuid NOT NULL,
 rule_id uuid NOT NULL,
 mes_inicio text NOT NULL CHECK (mes_inicio ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,rule_id),
 FOREIGN KEY(user_id,rule_id) REFERENCES public.recurring_rules(user_id,id) ON DELETE CASCADE
);
ALTER TABLE public.recurring_endings ENABLE ROW LEVEL SECURITY;
CREATE POLICY recurring_endings_select ON public.recurring_endings FOR SELECT TO authenticated USING ((select auth.uid())=user_id);
CREATE POLICY recurring_endings_insert ON public.recurring_endings FOR INSERT TO authenticated WITH CHECK ((select auth.uid())=user_id);
CREATE POLICY recurring_endings_update ON public.recurring_endings FOR UPDATE TO authenticated USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
REVOKE ALL ON public.recurring_endings FROM anon;
GRANT SELECT,INSERT,UPDATE ON public.recurring_endings TO authenticated;
CREATE FUNCTION public.end_recurring_from_month(p_rule_id uuid,p_month text) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE result text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 INSERT INTO public.recurring_endings(user_id,rule_id,mes_inicio) VALUES(auth.uid(),p_rule_id,p_month)
 ON CONFLICT(user_id,rule_id) DO UPDATE SET mes_inicio=least(public.recurring_endings.mes_inicio,excluded.mes_inicio)
 RETURNING mes_inicio INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.end_recurring_from_month(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.end_recurring_from_month(uuid,text) TO authenticated;
-- No preexisting row changes. NOT VALID checks enforce new writes while leaving
-- historical records intact. Investments never belong to the variable Diário.
ALTER TABLE public.transactions ADD CONSTRAINT investment_not_daily CHECK (tipo <> 'investimento' OR incluido_diario = false) NOT VALID;
ALTER TABLE public.recurring_rules ADD CONSTRAINT investment_not_daily CHECK (tipo <> 'investimento' OR incluido_diario = false) NOT VALID;
