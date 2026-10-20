-- Keep anonymous read policies independent of helpers whose EXECUTE privilege
-- is intentionally restricted to authenticated users by the final hardening
-- migration. PostgreSQL checks function privileges while planning a query, so
-- relying on OR short-circuiting is not a safe way to make these policies work.

-- Public image reads need only know whether the parent listing is published.
drop policy if exists property_images_select on public.property_images;
drop policy if exists property_images_anon_select on public.property_images;
drop policy if exists property_images_authenticated_select on public.property_images;
create policy property_images_anon_select on public.property_images
  for select to anon
  using (public.property_is_public(property_id));
create policy property_images_authenticated_select on public.property_images
  for select to authenticated
  using (public.property_is_public(property_id) or public.owns_property(property_id));

drop policy if exists property_amenities_select on public.property_amenities;
drop policy if exists property_amenities_anon_select on public.property_amenities;
drop policy if exists property_amenities_authenticated_select on public.property_amenities;
create policy property_amenities_anon_select on public.property_amenities
  for select to anon
  using (public.property_is_public(property_id));
create policy property_amenities_authenticated_select on public.property_amenities
  for select to authenticated
  using (public.property_is_public(property_id) or public.owns_property(property_id));

drop policy if exists property_videos_select on public.property_videos;
drop policy if exists property_videos_anon_select on public.property_videos;
drop policy if exists property_videos_authenticated_select on public.property_videos;
create policy property_videos_anon_select on public.property_videos
  for select to anon
  using (public.property_is_public(property_id));
create policy property_videos_authenticated_select on public.property_videos
  for select to authenticated
  using (public.property_is_public(property_id) or public.owns_property(property_id));

-- current_role_is() is authenticated-only after the MFA/RPC lockdown. Keep
-- the anonymous settings policy limited to values explicitly marked public.
drop policy if exists app_settings_public_read on public.app_settings;
drop policy if exists app_settings_anon_read on public.app_settings;
drop policy if exists app_settings_authenticated_read on public.app_settings;
create policy app_settings_anon_read on public.app_settings
  for select to anon
  using (is_public);
create policy app_settings_authenticated_read on public.app_settings
  for select to authenticated
  using (is_public or public.current_role_is(array['admin']::public.user_role[]));
