-- ONLY Supabase horizonte-testes (hsvjkbfpvmtnehjbwtgr), via execute_sql project_id.
-- Substitute TWO NEW random UUIDs for placeholders. Inserts refuse existing UUIDs.
-- Technical Auth fixtures have NO password/session/confirmed email; not real logins.
-- Financial operations run as authenticated under active RLS. Everything rolls back.
-- Temporary restore preserves columns/checks/unique indexes, not FKs/Auth/full DB.
BEGIN;
INSERT INTO auth.users(id,email,aud,role,raw_app_meta_data,raw_user_meta_data) VALUES ('__USER_A__','hf-audit-a@example.invalid','authenticated','authenticated','{}','{}'),('__USER_B__','hf-audit-b@example.invalid','authenticated','authenticated','{}','{}');
SELECT set_config('request.jwt.claims','{"sub":"__USER_A__","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
INSERT INTO public.settings(user_id,saldo_abertura,data_ancora) VALUES('__USER_A__',1000,'2099-01-01');
INSERT INTO public.transactions(user_id,tipo,valor,descricao,categoria,data) VALUES('__USER_A__','entrada',500,'HF AUDIT income','','2099-01-02'),('__USER_A__','saida',50,'HF AUDIT expense','','2099-01-03');
INSERT INTO public.recurring_rules(user_id,tipo,valor,descricao,categoria,frequencia,dia_do_mes,data_inicio,modo_termino,valor_termino) VALUES('__USER_A__','saida',100,'HF AUDIT rent','','mensal',5,'2099-01-01','ocorrencias','2');
INSERT INTO public.daily_budgets(user_id,descricao,categoria,valor_mensal) VALUES('__USER_A__','HF AUDIT daily','',310);
INSERT INTO public.daily_actuals(user_id,data,valor) VALUES('__USER_A__','2099-01-01',0);
SELECT public.create_credit_card('HF AUDIT card',31,'[{"mes_referencia":"2099-01","valor":200},{"mes_referencia":"2099-02","valor":150}]');
UPDATE public.transactions SET valor=60,data='2099-01-04' WHERE user_id='__USER_A__' AND tipo='saida';
UPDATE public.recurring_rules SET dia_do_mes=6 WHERE user_id='__USER_A__';
UPDATE public.card_invoices SET valor=210 WHERE user_id='__USER_A__' AND mes_referencia='2099-01';
CREATE TEMP TABLE hf_audit_export ON COMMIT DROP AS SELECT jsonb_build_object(
'settings',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.settings t WHERE user_id='__USER_A__'),
'transactions',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.transactions t WHERE user_id='__USER_A__'),
'recurring_rules',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.recurring_rules t WHERE user_id='__USER_A__'),
'daily_budgets',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.daily_budgets t WHERE user_id='__USER_A__'),
'daily_actuals',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.daily_actuals t WHERE user_id='__USER_A__'),
'credit_cards',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.credit_cards t WHERE user_id='__USER_A__'),
'card_invoices',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.card_invoices t WHERE user_id='__USER_A__')) AS snapshot;
DO $test$ BEGIN
BEGIN UPDATE public.settings SET user_id='__USER_B__' WHERE user_id='__USER_A__'; RAISE EXCEPTION 'FAIL ownership reassignment'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
BEGIN INSERT INTO public.card_invoices(user_id,card_id,mes_referencia,valor) SELECT '__USER_B__',id,'2099-03',1 FROM public.credit_cards WHERE user_id='__USER_A__'; RAISE EXCEPTION 'FAIL invoice ownership'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
BEGIN PERFORM public.create_credit_card('HF AUDIT duplicate',1,'[{"mes_referencia":"2099-01","valor":1},{"mes_referencia":"2099-01","valor":2}]'); RAISE EXCEPTION 'FAIL duplicate'; EXCEPTION WHEN unique_violation THEN NULL; END;
IF EXISTS(SELECT 1 FROM public.credit_cards WHERE nome='HF AUDIT duplicate') THEN RAISE EXCEPTION 'FAIL RPC atomicity'; END IF;
END $test$;
SELECT set_config('request.jwt.claims','{"sub":"__USER_B__","role":"authenticated"}',true);
DO $test$ DECLARE tab text; n integer; BEGIN
FOREACH tab IN ARRAY ARRAY['settings','transactions','recurring_rules','daily_budgets','daily_actuals','credit_cards','card_invoices'] LOOP
EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id=$1',tab) INTO n USING '__USER_A__'::uuid;
IF n<>0 THEN RAISE EXCEPTION 'FAIL cross-user read %',tab; END IF;
EXECUTE format('UPDATE public.%I SET user_id=user_id WHERE user_id=$1',tab) USING '__USER_A__'::uuid;
GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'FAIL cross-user update %',tab; END IF;
END LOOP;
BEGIN INSERT INTO public.settings(user_id,saldo_abertura,data_ancora) VALUES('__USER_A__',0,'2099-01-01'); RAISE EXCEPTION 'FAIL forged owner'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
SELECT set_config('request.jwt.claims','{"sub":"__USER_A__","role":"authenticated"}',true);
DO $restore$
DECLARE tab text; restored jsonb; original jsonb;
BEGIN
FOREACH tab IN ARRAY ARRAY['settings','transactions','recurring_rules','daily_budgets','daily_actuals','credit_cards','card_invoices'] LOOP
 EXECUTE format('CREATE TEMP TABLE %I (LIKE public.%I INCLUDING ALL) ON COMMIT DROP','hf_restore_'||tab,tab);
 SELECT snapshot->tab INTO original FROM hf_audit_export;
 EXECUTE format('INSERT INTO pg_temp.%I SELECT * FROM jsonb_populate_recordset(NULL::public.%I,$1)','hf_restore_'||tab,tab) USING original;
 EXECUTE format('SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM pg_temp.%I t','hf_restore_'||tab) INTO restored;
 IF restored IS DISTINCT FROM original THEN RAISE EXCEPTION 'FAIL: temporary restore % mismatch',tab; END IF;
END LOOP;
END $restore$;
SELECT 'PASS: 7-table RLS reads/updates, rejected forgery, RPC atomicity, exact temporary JSON restore; NOT HTTP or full DB restore' AS result;
RESET ROLE;
ROLLBACK;
