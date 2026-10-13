-- Incremental only. Existing rows are neither updated nor deleted.
create unique index recurring_rules_owner_identity on public.recurring_rules(user_id,id);
create table public.recurring_exceptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_id uuid not null,
  mes_referencia text not null check (mes_referencia ~ '^[1-9][0-9]{3}-(0[1-9]|1[0-2])$'),
  created_at timestamptz not null default now(),
  primary key (user_id,rule_id,mes_referencia),
  foreign key (user_id,rule_id) references public.recurring_rules(user_id,id) on delete cascade
);
alter table public.recurring_exceptions enable row level security;
revoke all on public.recurring_exceptions from public,anon,authenticated;
grant select,insert,update,delete on public.recurring_exceptions to authenticated;
create policy recurring_exceptions_owner on public.recurring_exceptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- A month cancellation stays bound to the civil month through schedule edits.
comment on table public.recurring_exceptions is 'Cancelled rule/month; applies to all firings in that month, regardless of subsequent due day, frequency or period edits.';

alter table public.credit_cards add column creation_request_id uuid;
create unique index credit_cards_creation_request on public.credit_cards(user_id,creation_request_id);
create function public.create_credit_card_once(p_nome text,p_dia integer,p_faturas jsonb,p_request_id uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare card uuid; owner uuid := auth.uid();
begin
  if owner is null or p_request_id is null then raise exception 'Authentication and request ID required'; end if;
  -- Serializes concurrent retries of this user's exact request, not all cards.
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':' || p_request_id::text,0));
  select id into card from public.credit_cards where user_id=owner and creation_request_id=p_request_id;
  if card is not null then return card; end if;
  card := public.create_credit_card(p_nome,p_dia,p_faturas);
  update public.credit_cards set creation_request_id=p_request_id where id=card and user_id=owner;
  return card;
end $$;
revoke all on function public.create_credit_card_once(text,integer,jsonb,uuid) from public,anon;
grant execute on function public.create_credit_card_once(text,integer,jsonb,uuid) to authenticated;
