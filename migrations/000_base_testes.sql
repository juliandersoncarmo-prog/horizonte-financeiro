CREATE TYPE public.tipo_transacao AS ENUM ('entrada','saida');
CREATE TYPE public.frequencia AS ENUM ('mensal','quinzenal','semanal','unico');
CREATE TYPE public.modo_termino AS ENUM ('nunca','horizonte','ocorrencias','data');
CREATE TABLE public.settings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
 saldo_abertura numeric(15,2) NOT NULL, data_ancora date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 tipo public.tipo_transacao NOT NULL, valor numeric(15,2) NOT NULL CHECK(valor >= 0 AND valor <= 999999999),
 descricao text NOT NULL, categoria text NOT NULL, data date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX transactions_data_idx ON public.transactions(data);
CREATE TABLE public.recurring_rules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 tipo public.tipo_transacao NOT NULL, valor numeric(15,2) NOT NULL CHECK(valor >= 0 AND valor <= 999999999),
 descricao text NOT NULL, categoria text NOT NULL, frequencia public.frequencia NOT NULL,
 dia_do_mes integer NOT NULL CHECK(dia_do_mes BETWEEN 1 AND 31), data_inicio date NOT NULL,
 modo_termino public.modo_termino NOT NULL, valor_termino text, ativo boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recurring_rules_user_id_idx ON public.recurring_rules(user_id);
CREATE TABLE public.daily_budgets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 mes_referencia text CHECK(mes_referencia IS NULL OR mes_referencia ~ '^[1-9][0-9]{3}-(0[1-9]|1[0-2])$'),
 descricao text NOT NULL, categoria text NOT NULL,
 valor_mensal numeric(15,2) NOT NULL CHECK(valor_mensal >= 0 AND valor_mensal <= 999999999),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX daily_budgets_user_id_idx ON public.daily_budgets(user_id);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_owner ON public.settings FOR ALL TO authenticated
 USING(user_id = (select auth.uid())) WITH CHECK(user_id = (select auth.uid()));
REVOKE ALL ON public.settings FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.settings TO authenticated;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_owner ON public.transactions FOR ALL TO authenticated
 USING(user_id = (select auth.uid())) WITH CHECK(user_id = (select auth.uid()));
REVOKE ALL ON public.transactions FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.transactions TO authenticated;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY recurring_rules_owner ON public.recurring_rules FOR ALL TO authenticated
 USING(user_id = (select auth.uid())) WITH CHECK(user_id = (select auth.uid()));
REVOKE ALL ON public.recurring_rules FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.recurring_rules TO authenticated;
ALTER TABLE public.daily_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY daily_budgets_owner ON public.daily_budgets FOR ALL TO authenticated
 USING(user_id = (select auth.uid())) WITH CHECK(user_id = (select auth.uid()));
REVOKE ALL ON public.daily_budgets FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.daily_budgets TO authenticated;
