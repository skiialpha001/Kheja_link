-- Keep public listing media visible without granting anonymous callers access
-- to the security-definer owner lookup. The owner helper is intentionally
-- executable only by signed-in users (see 20261017133641_admin_mfa_rpc_lockdown.sql).

-- Images: visitors see media only for published listings; signed-in owners
-- can also read their own unpublished listing media.
drop policy if exists property_images_select on public.property_images;
drop policy if exists property_images_select_public on public.property_images;
drop policy if exists property_images_select_owner on public.property_images;

create policy property_images_select_public
  on public.property_images
  for select to anon
  using (public.property_is_public(property_id));

create policy property_images_select_owner
  on public.property_images
  for select to authenticated
  using (
    public.property_is_public(property_id)
    or public.owns_property(property_id)
  );

-- Amenities follow the same published-or-owner visibility rule.
drop policy if exists property_amenities_select on public.property_amenities;
drop policy if exists property_amenities_select_public on public.property_amenities;
drop policy if exists property_amenities_select_owner on public.property_amenities;

create policy property_amenities_select_public
  on public.property_amenities
  for select to anon
  using (public.property_is_public(property_id));

create policy property_amenities_select_owner
  on public.property_amenities
  for select to authenticated
  using (
    public.property_is_public(property_id)
    or public.owns_property(property_id)
  );

-- Videos are another public listing child resource, including in mobile API
-- clients, so keep their role split aligned with images and amenities.
drop policy if exists property_videos_select on public.property_videos;
drop policy if exists property_videos_select_public on public.property_videos;
drop policy if exists property_videos_select_owner on public.property_videos;

create policy property_videos_select_public
  on public.property_videos
  for select to anon
  using (public.property_is_public(property_id));

create policy property_videos_select_owner
  on public.property_videos
  for select to authenticated
  using (
    public.property_is_public(property_id)
    or public.owns_property(property_id)
  );
