CREATE INDEX card_invoices_card_owner_idx ON public.card_invoices(card_id,user_id);
ALTER POLICY daily_actuals_owner ON public.daily_actuals USING(user_id = (select auth.uid())) WITH CHECK(user_id = (select auth.uid()));
ALTER POLICY credit_cards_owner ON public.credit_cards USING(user_id = (select auth.uid())) WITH CHECK(user_id = (select auth.uid()));
ALTER POLICY card_invoices_owner ON public.card_invoices USING(user_id = (select auth.uid())) WITH CHECK(user_id = (select auth.uid()));
