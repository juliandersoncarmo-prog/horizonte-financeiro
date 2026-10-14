-- Replace placeholders with fresh UUIDs; authorized project only.
BEGIN;
INSERT INTO auth.users(id,email,aud,role) VALUES ('__A__','hf-invest-a@example.invalid','authenticated','authenticated'),('__B__','hf-invest-b@example.invalid','authenticated','authenticated');
SELECT set_config('request.jwt.claims','{"sub":"__A__","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
INSERT INTO public.transactions(id,user_id,tipo,valor,descricao,categoria,data) VALUES ('__T__','__A__','investimento',100,'HF synthetic investment','','2099-09-05');
INSERT INTO public.recurring_rules(id,user_id,tipo,valor,descricao,categoria,frequencia,dia_do_mes,data_inicio,modo_termino) VALUES ('__R__','__A__','investimento',50,'HF synthetic recurring','','semanal',5,'2099-09-01','nunca');
DO $test$ BEGIN
 UPDATE public.transactions SET valor=120,data='2099-09-06' WHERE id='__T__';
 IF NOT EXISTS(SELECT 1 FROM public.transactions WHERE id='__T__' AND valor=120 AND data='2099-09-06') THEN RAISE EXCEPTION 'FAIL edit'; END IF;
 BEGIN UPDATE public.transactions SET incluido_diario=true WHERE id='__T__'; RAISE EXCEPTION 'FAIL investment daily allowed'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.recurring_rules SET incluido_diario=true WHERE id='__R__'; RAISE EXCEPTION 'FAIL recurring daily allowed'; EXCEPTION WHEN check_violation THEN NULL; END;
END $test$;
INSERT INTO public.recurring_exceptions(user_id,rule_id,mes_referencia) VALUES ('__A__','__R__','2099-10') ON CONFLICT DO NOTHING;
INSERT INTO public.recurring_exceptions(user_id,rule_id,mes_referencia) VALUES ('__A__','__R__','2099-10') ON CONFLICT DO NOTHING;
SELECT public.end_recurring_from_month('__R__','2099-11');
SELECT public.end_recurring_from_month('__R__','2099-12');
DO $test$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.recurring_endings WHERE rule_id='__R__' AND mes_inicio='2099-11') THEN RAISE EXCEPTION 'FAIL later replay extended'; END IF;
 IF (SELECT count(*) FROM public.recurring_exceptions WHERE rule_id='__R__')<>1 THEN RAISE EXCEPTION 'FAIL dedup'; END IF;
 UPDATE public.recurring_rules SET valor=60,frequencia='quinzenal',dia_do_mes=10,modo_termino='data',valor_termino='2100-12-31' WHERE id='__R__';
 IF NOT EXISTS(SELECT 1 FROM public.recurring_endings WHERE rule_id='__R__' AND mes_inicio='2099-11') THEN RAISE EXCEPTION 'FAIL schedule wiped cutoff'; END IF;
 BEGIN PERFORM public.end_recurring_from_month('__R__','2099-13'); RAISE EXCEPTION 'FAIL invalid month'; EXCEPTION WHEN check_violation THEN NULL; END;
END $test$;
SELECT set_config('request.jwt.claims','{"sub":"__B__","role":"authenticated"}',true);
DO $test$ DECLARE n integer; BEGIN
 IF EXISTS(SELECT 1 FROM public.recurring_endings WHERE rule_id='__R__') OR EXISTS(SELECT 1 FROM public.transactions WHERE id='__T__') THEN RAISE EXCEPTION 'FAIL cross-owner read'; END IF;
 UPDATE public.transactions SET valor=999 WHERE id='__T__'; GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'FAIL cross-owner edit'; END IF;
 DELETE FROM public.transactions WHERE id='__T__'; GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'FAIL cross-owner delete'; END IF;
 BEGIN PERFORM public.end_recurring_from_month('__R__','2099-10'); RAISE EXCEPTION 'FAIL foreign rule cutoff'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 BEGIN INSERT INTO public.recurring_endings VALUES('__A__','__R__','2099-09'); RAISE EXCEPTION 'FAIL forged owner'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
SELECT set_config('request.jwt.claims','{"sub":"__A__","role":"authenticated"}',true);
DO $test$ BEGIN
 BEGIN UPDATE public.recurring_endings SET user_id='__B__' WHERE rule_id='__R__'; RAISE EXCEPTION 'FAIL owner reassignment'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 DELETE FROM public.transactions WHERE id='__T__';
 IF EXISTS(SELECT 1 FROM public.transactions WHERE id='__T__') THEN RAISE EXCEPTION 'FAIL delete'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.recurring_rules WHERE id='__R__') THEN RAISE EXCEPTION 'FAIL historical rule lost'; END IF;
END $test$;
RESET ROLE; SET LOCAL ROLE anon;
DO $test$ BEGIN
 BEGIN PERFORM 1 FROM public.recurring_endings; RAISE EXCEPTION 'FAIL anon read'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.end_recurring_from_month('__R__','2099-11'); RAISE EXCEPTION 'FAIL anon rpc'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
SELECT 'PASS: investment CRUD, reconciliation checks, cutoff replay, edit preservation, RLS ownership/FK, anonymous blocked' AS result;
ROLLBACK;
