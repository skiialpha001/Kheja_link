-- Public callers may read only rows explicitly marked public. The admin
-- predicate is intentionally kept out of the anon policy because anon cannot
-- execute current_role_is(). Authenticated admins retain access to private
-- settings; ordinary signed-in users only see public rows.
alter table public.app_settings enable row level security;

drop policy if exists app_settings_public_read on public.app_settings;
drop policy if exists app_settings_anon_public_read on public.app_settings;
drop policy if exists app_settings_authenticated_read on public.app_settings;

create policy app_settings_anon_public_read
  on public.app_settings
  for select
  to anon
  using (is_public is true);

create policy app_settings_authenticated_read
  on public.app_settings
  for select
  to authenticated
  using (
    is_public is true
    or public.current_role_is(array['admin']::public.user_role[])
  );

grant select on table public.app_settings to anon, authenticated;

-- This table is internal-only. Keep explicit service_role and postgres access
-- unchanged for server-side and maintenance operations.
revoke all privileges on table public.notification_outbox
  from public, anon, authenticated;
