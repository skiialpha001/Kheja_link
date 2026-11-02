-- Mark temporary sample listings explicitly so customers can identify them
-- and so neither the web nor mobile app can charge to unlock fake contacts.
begin;

alter table public.properties
  add column if not exists is_demo boolean not null default false;

create or replace function public.start_contact_unlock(p_property_id uuid)
returns table (reference text, amount numeric, currency text, already_unlocked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_fee numeric := public.unlock_fee();
  v_cur text := public.unlock_currency();
  v_ref text;
begin
  if v_uid is null then
    raise exception 'Sign in to continue.' using errcode = '28000';
  end if;

  if exists (
    select 1 from public.properties p
     where p.id = p_property_id and p.is_demo
  ) then
    raise exception 'Demo listings cannot be contacted or unlocked.' using errcode = 'P0001';
  end if;

  -- An open window (or ownership, or a House Hunting pass): nothing to buy.
  if public.owns_property(p_property_id) or public.has_contact_unlock(p_property_id) then
    return query select null::text, v_fee, v_cur, true;
    return;
  end if;

  if not public.property_is_public(p_property_id) then
    raise exception 'This home is no longer listed.' using errcode = 'P0002';
  end if;

  update public.contact_unlocks cu
     set status = 'failed'
   where cu.user_id = v_uid and cu.property_id = p_property_id and cu.status = 'pending'
     and (cu.created_at < now() - interval '1 hour' or cu.amount <> v_fee);

  select cu.provider_ref into v_ref
    from public.contact_unlocks cu
   where cu.user_id = v_uid and cu.property_id = p_property_id and cu.status = 'pending'
   limit 1;

  if v_ref is null then
    v_ref := 'kl_' || replace(gen_random_uuid()::text, '-', '');
    insert into public.contact_unlocks (user_id, property_id, status, provider, provider_ref)
    values (v_uid, p_property_id, 'pending', 'paystack', v_ref);
  end if;

  return query
    select cu.provider_ref, cu.amount, cu.currency::text, false
      from public.contact_unlocks cu
     where cu.provider_ref = v_ref;
end;
$$;

revoke all on function public.start_contact_unlock(uuid) from public, anon;
grant execute on function public.start_contact_unlock(uuid) to authenticated;

create or replace function public.get_property_contact(p_property_id uuid)
returns table (
  unlocked boolean,
  unlocked_until timestamptz,
  landlord_name text,
  contact_phone text,
  contact_whatsapp text,
  caretaker_name text,
  caretaker_phone text,
  management_name text,
  management_phone text,
  address_line text,
  building_name text,
  latitude numeric,
  longitude numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_is_public boolean;
  v_is_demo boolean;
  v_until timestamptz;
  v_entitled boolean;
begin
  select p.owner_id, (p.status = 'published'), p.is_demo
    into v_owner, v_is_public, v_is_demo
    from public.properties p
   where p.id = p_property_id;

  if coalesce(v_is_demo, false) then
    return query select false, null::timestamptz, null::text, null::text, null::text,
                        null::text, null::text, null::text, null::text, null::text,
                        null::text, null::numeric, null::numeric;
    return;
  end if;

  -- coalesce everywhere: auth.uid() is NULL for a signed-out caller (see 0009).
  v_until := public.active_unlock_until(auth.uid(), p_property_id);
  v_entitled :=
    v_owner is not null and (
      coalesce(v_owner = auth.uid(), false)
      or public.current_role_is(array['admin']::public.user_role[])
      or (coalesce(v_is_public, false) and coalesce(public.has_contact_unlock(p_property_id), false))
    );

  if v_entitled is not true then
    return query select false, null::timestamptz, null::text, null::text, null::text,
                        null::text, null::text, null::text, null::text, null::text,
                        null::text, null::numeric, null::numeric;
    return;
  end if;

  return query
    select true,
           case when coalesce(v_owner = auth.uid(), false) then null else v_until end,
           coalesce(nullif(trim(p.landlord_name), ''), pr.full_name),
           p.contact_phone,
           p.contact_whatsapp,
           p.caretaker_name,
           p.caretaker_phone,
           public.setting_text('management_name'),
           public.setting_text('management_phone'),
           p.address_line,
           p.building_name,
           p.latitude,
           p.longitude
      from public.properties p
      left join public.profiles pr on pr.id = p.owner_id
     where p.id = p_property_id;
end;
$$;

revoke all on function public.get_property_contact(uuid) from public;
grant execute on function public.get_property_contact(uuid) to anon, authenticated;

commit;
