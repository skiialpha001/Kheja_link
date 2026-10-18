-- Require a verified second factor for every admin role check. Since existing
-- admin RPCs and RLS policies call this helper, one check secures them all.
create or replace function public.current_role_is(p_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.profiles as pr
     where pr.id = auth.uid()
       and pr.role = any (p_roles)
       and (pr.role <> 'admin'::public.user_role or auth.jwt() ->> 'aal' = 'aal2')
  );
$$;

revoke all on function public.current_role_is(public.user_role[]) from public, anon;
grant execute on function public.current_role_is(public.user_role[]) to authenticated;

-- Keep non-sensitive landlord display data separate from the private profiles
-- table, so the public profile view can run with caller privileges.
create table if not exists public.public_profile_cards (
  id uuid primary key references public.profiles(id) on delete cascade,
  full_name text,
  avatar_url text,
  is_verified boolean not null default false,
  role public.user_role not null,
  created_at timestamptz not null
);

alter table public.public_profile_cards enable row level security;
drop policy if exists public_profile_cards_listed_owners on public.public_profile_cards;
create policy public_profile_cards_listed_owners
  on public.public_profile_cards for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties as p
       where p.owner_id = public_profile_cards.id
         and p.status = 'published'::public.property_status
    )
  );

revoke all on public.public_profile_cards from public, anon, authenticated;
grant select (id, full_name, avatar_url, is_verified, role, created_at)
  on public.public_profile_cards to anon, authenticated;

create or replace function public.sync_public_profile_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.public_profile_cards (id, full_name, avatar_url, is_verified, role, created_at)
  values (new.id, new.full_name, new.avatar_url, new.is_verified, new.role, new.created_at)
  on conflict (id) do update set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    is_verified = excluded.is_verified,
    role = excluded.role,
    created_at = excluded.created_at;
  return new;
end;
$$;

revoke all on function public.sync_public_profile_card() from public, anon, authenticated;
drop trigger if exists profiles_sync_public_profile_card on public.profiles;
create trigger profiles_sync_public_profile_card
  after insert or update of full_name, avatar_url, is_verified, role on public.profiles
  for each row execute function public.sync_public_profile_card();

insert into public.public_profile_cards (id, full_name, avatar_url, is_verified, role, created_at)
select id, full_name, avatar_url, is_verified, role, created_at from public.profiles
on conflict (id) do update set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  is_verified = excluded.is_verified,
  role = excluded.role,
  created_at = excluded.created_at;

create or replace view public.public_profiles
with (security_invoker = true) as
  select c.id, c.full_name, c.avatar_url, c.is_verified, c.role, c.created_at
    from public.public_profile_cards as c
   where exists (
     select 1 from public.properties as p
      where p.owner_id = c.id and p.status = 'published'::public.property_status
   );

revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;

-- These functions have no browser use. Trigger execution does not require
-- granting callers permission to invoke trigger functions over PostgREST.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.house_submissions_after_insert() from public, anon, authenticated;
revoke all on function public.house_submissions_limit() from public, anon, authenticated;
revoke all on function public.hunting_track_request() from public, anon, authenticated;
revoke all on function public.inquiries_guard_update() from public, anon, authenticated;
revoke all on function public.inquiries_rate_limit() from public, anon, authenticated;
revoke all on function public.notify_landlord_on_inquiry() from public, anon, authenticated;
revoke all on function public.notify_landlord_on_tenancy() from public, anon, authenticated;
revoke all on function public.notify_sender_on_reply() from public, anon, authenticated;
revoke all on function public.notify_watchers_on_status_change() from public, anon, authenticated;
revoke all on function public.profiles_guard_privileged_columns() from public, anon, authenticated;
revoke all on function public.sync_like_count() from public, anon, authenticated;
revoke all on function public.tenancies_guard_transition() from public, anon, authenticated;

-- The maintenance job already runs inside pg_cron. It and checkout lookups
-- are server/database-only and must not be callable with public API keys.
revoke all on function public.run_daily_maintenance() from public, anon, authenticated;
grant execute on function public.run_daily_maintenance() to service_role;
revoke all on function public.hunting_checkout_details(text) from public, anon, authenticated;
grant execute on function public.hunting_checkout_details(text) to service_role;
revoke all on function public.unlock_checkout_details(text) from public, anon, authenticated;
grant execute on function public.unlock_checkout_details(text) to service_role;

-- Owner-only details and identity helpers are for signed-in sessions.
revoke all on function public.get_my_property_private(uuid) from public, anon;
revoke all on function public.get_property_contact(uuid) from public, anon;
revoke all on function public.has_contact_unlock(uuid) from public, anon;
revoke all on function public.owns_property(uuid) from public, anon;

-- The existing in-database maintenance job replaces direct RPC calls from
-- Vercel/GitHub, so no anonymous or user JWT is trusted as a scheduler.
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'kheja-daily-maintenance' limit 1;
  if v_job_id is not null then
    perform cron.alter_job(v_job_id, schedule => '0 * * * *');
  else
    perform cron.schedule('kheja-daily-maintenance', '0 * * * *',
                          'select public.run_daily_maintenance()');
  end if;
end;
$$;

-- Close the mutable search_path lints. These bodies only use pg_catalog
-- built-ins and do not depend on unqualified application objects.
alter function public.set_updated_at() set search_path = pg_catalog;
alter function public.properties_stamp_published() set search_path = pg_catalog;
alter function public.properties_sync_availability() set search_path = pg_catalog;
alter function public.money_label(numeric, text) set search_path = pg_catalog;

-- Install unaccent in the non-exposed extensions schema going forward and move
-- the existing relocatable extension without changing its function OIDs.
create schema if not exists extensions;
alter extension unaccent set schema extensions;
