-- Apply once ONLY in an isolated test Supabase after inventorying its schema.
-- Additive: does not read, convert or alter any legacy financial record.
BEGIN;
CREATE TABLE public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL CHECK (length(btrim(nome)) BETWEEN 1 AND 100),
  dia_vencimento integer NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)
);
CREATE INDEX credit_cards_user_idx ON public.credit_cards(user_id);
CREATE TABLE public.card_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  card_id uuid NOT NULL,
  mes_referencia text NOT NULL CHECK (mes_referencia ~ '^[1-9][0-9]{3}-(0[1-9]|1[0-2])$'),
  valor numeric(15,2) NOT NULL CHECK (valor >= 0 AND valor <= 999999999),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (card_id, user_id) REFERENCES public.credit_cards(id, user_id) ON DELETE CASCADE,
  UNIQUE(user_id, card_id, mes_referencia)
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_cards_owner ON public.credit_cards FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY card_invoices_owner ON public.card_invoices FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
REVOKE ALL ON public.credit_cards, public.card_invoices FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_cards, public.card_invoices TO authenticated;

-- Initial card + all invoices are one transaction. Invoker keeps RLS active.
CREATE FUNCTION public.create_credit_card(p_nome text, p_dia integer, p_faturas jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE card uuid; owner uuid := auth.uid(); item jsonb; amount numeric;
BEGIN
  IF owner IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_nome IS NULL OR length(btrim(p_nome)) NOT BETWEEN 1 AND 100
    OR p_dia IS NULL OR p_dia NOT BETWEEN 1 AND 31
    OR p_faturas IS NULL OR jsonb_typeof(p_faturas) <> 'array' THEN
    RAISE EXCEPTION 'Invalid card';
  END IF;
  IF jsonb_array_length(p_faturas) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Invalid invoice count'; END IF;
  INSERT INTO public.credit_cards(user_id,nome,dia_vencimento)
    VALUES(owner,btrim(p_nome),p_dia) RETURNING id INTO card;
  FOR item IN SELECT value FROM jsonb_array_elements(p_faturas) LOOP
    IF jsonb_typeof(item->'mes_referencia') IS DISTINCT FROM 'string'
      OR (item->>'mes_referencia') !~ '^[1-9][0-9]{3}-(0[1-9]|1[0-2])$'
      OR jsonb_typeof(item->'valor') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid invoice'; END IF;
    amount := (item->>'valor')::numeric;
    IF amount < 0 OR amount > 999999999 OR amount <> round(amount,2) THEN RAISE EXCEPTION 'Invalid amount'; END IF;
    INSERT INTO public.card_invoices(user_id,card_id,mes_referencia,valor)
      VALUES(owner,card,item->>'mes_referencia',amount);
  END LOOP;
  RETURN card;
END; $$;
REVOKE ALL ON FUNCTION public.create_credit_card(text,integer,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_credit_card(text,integer,jsonb) TO authenticated;
COMMIT;
