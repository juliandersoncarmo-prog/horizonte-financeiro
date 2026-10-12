-- Replace user placeholders with two disposable test Auth UUIDs; never use production.
BEGIN;
SELECT set_config('request.jwt.claims','{"sub":"__USER_A__","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE a uuid := '__USER_A__'; b uuid := '__USER_B__'; card uuid; rec record; n integer;
BEGIN
 INSERT INTO public.settings(user_id,saldo_abertura,data_ancora) VALUES(a,-100,'2099-01-15');
 INSERT INTO public.transactions(user_id,tipo,valor,descricao,categoria,data,incluido_diario) VALUES(a,'saida',25,'HF SQL fixture','','2099-01-16',true);
 INSERT INTO public.recurring_rules(user_id,tipo,valor,descricao,categoria,frequencia,dia_do_mes,data_inicio,modo_termino,valor_termino) VALUES(a,'entrada',123.45,'HF SQL fixture','','mensal',31,'2099-01-15','ocorrencias','3');
 INSERT INTO public.daily_budgets(user_id,descricao,categoria,valor_mensal) VALUES(a,'HF SQL fixture','',100);
 INSERT INTO public.daily_actuals(user_id,data,valor) VALUES(a,'2099-01-16',0);
 card := public.create_credit_card('HF SQL fixture',31,'[{"mes_referencia":"2099-02","valor":0}]');
 BEGIN
  INSERT INTO public.settings(user_id,saldo_abertura,data_ancora) VALUES(a,999,'2099-01-15');
  RAISE EXCEPTION 'FAIL: settings uniqueness';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.daily_actuals(user_id,data,valor) VALUES(a,'2099-01-16',1);
  RAISE EXCEPTION 'FAIL: actual uniqueness';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.card_invoices(user_id,card_id,mes_referencia,valor) VALUES(a,card,'2099-02',1);
  RAISE EXCEPTION 'FAIL: invoice uniqueness';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  PERFORM public.create_credit_card('HF atomic fixture',31,'[{"mes_referencia":"2099-02","valor":1},{"mes_referencia":"2099-02","valor":2}]');
  RAISE EXCEPTION 'FAIL: RPC accepted duplicate';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 IF EXISTS(SELECT 1 FROM public.credit_cards WHERE nome='HF atomic fixture') THEN RAISE EXCEPTION 'FAIL: RPC rollback'; END IF;
 UPDATE public.daily_actuals SET valor=7.89 WHERE user_id=a;
 IF (SELECT valor FROM public.daily_actuals WHERE user_id=a) <> 7.89 THEN RAISE EXCEPTION 'FAIL: owner update'; END IF;
 BEGIN
  UPDATE public.daily_actuals SET user_id=b WHERE user_id=a;
  RAISE EXCEPTION 'FAIL: ownership reassignment';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims','{"sub":"__USER_B__","role":"authenticated"}',true);
 FOR rec IN SELECT unnest(ARRAY['settings','transactions','recurring_rules','daily_budgets','daily_actuals','credit_cards','card_invoices']) AS tab LOOP
  EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id=$1',rec.tab) INTO n USING a;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: cross-owner read %',rec.tab; END IF;
  EXECUTE format('DELETE FROM public.%I WHERE user_id=$1',rec.tab) USING a;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: cross-owner delete %',rec.tab; END IF;
  EXECUTE format('UPDATE public.%I SET user_id=user_id WHERE user_id=$1',rec.tab) USING a;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: cross-owner update %',rec.tab; END IF;
 END LOOP;
 BEGIN
  INSERT INTO public.daily_actuals(user_id,data,valor) VALUES(a,'2099-01-17',1);
  RAISE EXCEPTION 'FAIL: forged owner';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.card_invoices(user_id,card_id,mes_referencia,valor) VALUES(b,card,'2099-03',1);
  RAISE EXCEPTION 'FAIL: cross-owner card FK';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 INSERT INTO public.settings(user_id,saldo_abertura,data_ancora) VALUES(b,0,'2099-01-15');
 IF (SELECT count(*) FROM public.settings) <> 1 THEN RAISE EXCEPTION 'FAIL: user B isolation'; END IF;
END $test$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $test$
DECLARE rec record;
BEGIN
 FOR rec IN SELECT unnest(ARRAY['settings','transactions','recurring_rules','daily_budgets','daily_actuals','credit_cards','card_invoices']) AS tab LOOP
  BEGIN
   EXECUTE format('SELECT * FROM public.%I',rec.tab);
   RAISE EXCEPTION 'FAIL: anon granted access to %',rec.tab;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
 BEGIN
  PERFORM public.create_credit_card('anonymous',1,'[{"mes_referencia":"2099-01","valor":1}]');
  RAISE EXCEPTION 'FAIL: anon RPC';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: owner CRUD, 7-table cross-owner/anonymous isolation, reassignment, FK, uniqueness and RPC rollback; all fixtures rolled back' AS result;
