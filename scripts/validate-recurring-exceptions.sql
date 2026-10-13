-- ONLY hsvjkbfpvmtnehjbwtgr. Replace placeholders with fresh random UUIDs.
-- No real financial row is targeted. Technical Auth fixtures have no session/password.
begin;
insert into auth.users(id,email,aud,role) values ('__A__','hf-occ-a@example.invalid','authenticated','authenticated'),('__B__','hf-occ-b@example.invalid','authenticated','authenticated');
select set_config('request.jwt.claims','{"sub":"__A__","role":"authenticated"}',true);
set local role authenticated;
insert into public.recurring_rules(id,user_id,tipo,valor,descricao,categoria,frequencia,dia_do_mes,data_inicio,modo_termino)
values ('__R__','__A__','saida',1200,'HF OCC TEST','','mensal',5,'2099-01-01','nunca');
insert into public.recurring_exceptions(user_id,rule_id,mes_referencia) values ('__A__','__R__','2099-02') on conflict do nothing;
insert into public.recurring_exceptions(user_id,rule_id,mes_referencia) values ('__A__','__R__','2099-02') on conflict do nothing;
do $test$
declare first_card uuid; second_card uuid; n integer;
begin
 if (select count(*) from public.recurring_exceptions where rule_id='__R__') <> 1 then raise exception 'FAIL dedup exceptions'; end if;
 update public.recurring_rules set dia_do_mes=27,frequencia='semanal',data_inicio='2099-01-04',modo_termino='data',valor_termino='2099-04-30' where id='__R__';
 if not exists(select 1 from public.recurring_exceptions where rule_id='__R__' and mes_referencia='2099-02') then raise exception 'FAIL edit preservation'; end if;
 first_card := public.create_credit_card_once('HF OCC CARD',31,'[{"mes_referencia":"2099-02","valor":50}]','__REQUEST__');
 second_card := public.create_credit_card_once('HF OCC CARD',31,'[{"mes_referencia":"2099-02","valor":50}]','__REQUEST__');
 if first_card <> second_card then raise exception 'FAIL request identity'; end if;
 if (select count(*) from public.credit_cards where creation_request_id='__REQUEST__')<>1 then raise exception 'FAIL duplicate card'; end if;
 if (select count(*) from public.card_invoices where card_id=first_card)<>1 then raise exception 'FAIL duplicate invoice'; end if;
 update public.card_invoices set valor=60 where card_id=first_card;
 if not exists(select 1 from public.card_invoices where card_id=first_card and valor=60) then raise exception 'FAIL invoice edit'; end if;
 begin
   perform public.create_credit_card_once('HF OCC BAD',10,'[{"mes_referencia":"2099-02","valor":1},{"mes_referencia":"2099-02","valor":2}]','__BAD_REQUEST__');
   raise exception 'FAIL invalid duplicate accepted';
 exception when unique_violation then null; end;
 if exists(select 1 from public.credit_cards where nome='HF OCC BAD') then raise exception 'FAIL card atomicity'; end if;
end $test$;
select set_config('request.jwt.claims','{"sub":"__B__","role":"authenticated"}',true);
do $test$ declare n integer; begin
 if exists(select 1 from public.recurring_exceptions where user_id='__A__') then raise exception 'FAIL cross-owner read'; end if;
 delete from public.recurring_exceptions where user_id='__A__'; get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL cross-owner delete'; end if;
 begin
   insert into public.recurring_exceptions(user_id,rule_id,mes_referencia) values ('__A__','__R__','2099-03');
   raise exception 'FAIL forged owner';
 exception when insufficient_privilege then null; end;
 begin
   insert into public.recurring_exceptions(user_id,rule_id,mes_referencia) values ('__B__','__R__','2099-03');
   raise exception 'FAIL foreign rule';
 exception when foreign_key_violation then null; end;
 if exists(select 1 from public.credit_cards where creation_request_id='__REQUEST__') then raise exception 'FAIL cross-owner card'; end if;
end $test$;
select set_config('request.jwt.claims','{"sub":"__A__","role":"authenticated"}',true);
do $test$ begin
 begin
   update public.recurring_exceptions set user_id='__B__' where rule_id='__R__';
   raise exception 'FAIL exception owner reassignment';
 exception when insufficient_privilege then null; end;
 delete from public.recurring_rules where id='__R__' and user_id='__A__';
 if exists(select 1 from public.recurring_exceptions where rule_id='__R__') then raise exception 'FAIL whole-rule cascade'; end if;
end $test$;
reset role;
set local role anon;
do $test$ begin
 begin perform 1 from public.recurring_exceptions; raise exception 'FAIL anon read'; exception when insufficient_privilege then null; end;
 begin perform public.create_credit_card_once('x',1,'[]','__REQUEST__'); raise exception 'FAIL anon rpc'; exception when insufficient_privilege then null; end;
end $test$;
reset role;
select 'PASS: exceptions dedup, edit persistence, full-rule deletion, owner RLS/FK, anon blocked, card request replay, invoice updates and RPC atomicity' as result;
rollback;
