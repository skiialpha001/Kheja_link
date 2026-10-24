-- Kheja_Link backend prototype: privacy-first core.
-- This migration is isolated in backend-prototype and is NOT applied to the
-- existing project. Review and test it in a disposable local Supabase stack.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.property_status as enum ('draft', 'pending', 'published', 'rented', 'archived');
create type public.rent_period as enum ('month', 'year');

create table public.profiles_public (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('seeker', 'landlord', 'admin')),
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null,
  primary key (user_id, role)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
  title text not null check (char_length(trim(title)) between 5 and 160),
  description text not null default '' check (char_length(description) <= 6000),
  property_type text not null check (property_type in ('apartment', 'bedsitter', 'single_room', 'house', 'shop', 'other')),
  area text not null check (char_length(trim(area)) between 2 and 120),
  nearby text check (nearby is null or char_length(nearby) <= 500),
  rent_amount_kes integer not null check (rent_amount_kes between 1 and 100000000),
  rent_period public.rent_period not null default 'month',
  deposit_months smallint not null default 1 check (deposit_months between 0 and 24),
  bedrooms smallint not null default 0 check (bedrooms between 0 and 30),
  bathrooms smallint not null default 0 check (bathrooms between 0 and 30),
  is_furnished boolean not null default false,
  amenities text[] not null default '{}',
  status public.property_status not null default 'draft',
  available_from date,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_amenity_count check (cardinality(amenities) <= 30)
);

create index properties_published_newest_idx
  on public.properties (published_at desc, id)
  where status = 'published';
create index properties_owner_created_idx
  on public.properties (owner_id, created_at desc);
create index properties_area_type_price_idx
  on public.properties (area, property_type, rent_amount_kes)
  where status = 'published';

-- Sensitive fields are physically separate and in an unexposed schema.
create table private.property_contacts (
  property_id uuid primary key references public.properties(id) on delete cascade,
  landlord_phone text not null check (landlord_phone ~ '^\+?[0-9 ()-]{7,20}$'),
  whatsapp_phone text check (whatsapp_phone is null or whatsapp_phone ~ '^\+?[0-9 ()-]{7,20}$'),
  address_line text not null check (char_length(trim(address_line)) between 3 and 240),
  building_name text check (building_name is null or char_length(building_name) <= 120),
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  updated_at timestamptz not null default now()
);

create table private.contact_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  payment_reference text not null unique,
  paid_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint contact_unlock_window check (expires_at > paid_at),
  unique (user_id, property_id, paid_at)
);
create index contact_unlocks_active_idx
  on private.contact_unlocks (user_id, property_id, expires_at desc);

create table private.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_reference text not null unique,
  provider_transaction_id text unique,
  amount_minor integer not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- The unlock price is set by an operator after confirming the provider's
-- currency units. It is never accepted from a browser or mobile client.
create table private.payment_config (
  singleton boolean primary key default true check (singleton),
  unlock_amount_minor integer not null check (unlock_amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  intent_lifetime_minutes smallint not null default 10
    check (intent_lifetime_minutes between 1 and 60),
  unlock_lifetime_hours smallint not null default 3
    check (unlock_lifetime_hours between 1 and 24),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
create index favorites_property_idx on public.favorites (property_id);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 10 and 4000),
  status text not null default 'new' check (status in ('new', 'read', 'responded', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_property_created_idx on public.inquiries (property_id, created_at desc);
create index inquiries_sender_created_idx on public.inquiries (sender_id, created_at desc);

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

create trigger profiles_public_touch_updated_at
  before update on public.profiles_public
  for each row execute function public.touch_updated_at();
create trigger properties_touch_updated_at
  before update on public.properties
  for each row execute function public.touch_updated_at();
create trigger inquiries_touch_updated_at
  before update on public.inquiries
  for each row execute function public.touch_updated_at();

-- Catch obvious phone/email leakage into fields that appear on public pages.
-- The exact address/phone still never belongs in the public table. This is a
-- backstop for user-entered free text, not a semantic content moderation system.
create function public.reject_public_contact_data()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_text text;
begin
  if tg_table_name = 'properties' then
    v_text := concat_ws(' ', new.title, new.description, new.area, new.nearby);
  else
    v_text := new.display_name;
  end if;

  if v_text ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+[.][[:alpha:]]{2,}'
     or length(regexp_replace(v_text, '[^0-9]', '', 'g')) >= 7 then
    raise check_violation using message = 'Remove phone numbers and email addresses from public text';
  end if;
  return new;
end;
$$;
revoke all on function public.reject_public_contact_data() from public, anon, authenticated;
create trigger profiles_public_reject_contact_data
  before insert or update of display_name on public.profiles_public
  for each row execute function public.reject_public_contact_data();
create trigger properties_reject_contact_data
  before insert or update of title, description, area, nearby on public.properties
  for each row execute function public.reject_public_contact_data();

-- Signup metadata is user-controlled. It may set a display name only; a role
-- claim in user_metadata can never create an admin or landlord role.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles_public (user_id, display_name)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120)
  )
  on conflict (user_id) do nothing;

  insert into private.user_roles (user_id, role)
  values (new.id, 'seeker')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created_secure
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- RLS helper reads a private role table. The function returns only the
-- requesting user's boolean result; it accepts no user ID argument.
create function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = p_role
      and (
        ur.role <> 'admin'
        or coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      )
  );
$$;
revoke all on function public.has_role(text) from public, anon;
grant execute on function public.has_role(text) to authenticated;

-- A seeker may opt into landlord features. There is intentionally no public
-- operation that can grant the admin role.
create function public.become_landlord()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  insert into private.user_roles (user_id, role)
  values ((select auth.uid()), 'landlord')
  on conflict (user_id, role) do nothing;
end;
$$;
revoke all on function public.become_landlord() from public, anon;
grant execute on function public.become_landlord() to authenticated;

alter table public.profiles_public enable row level security;
alter table public.properties enable row level security;
alter table private.user_roles enable row level security;
alter table private.property_contacts enable row level security;
alter table private.contact_unlocks enable row level security;
alter table private.payment_intents enable row level security;
alter table private.payment_config enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;
alter table public.profiles_public force row level security;
alter table public.properties force row level security;
alter table public.favorites force row level security;
alter table public.inquiries force row level security;

-- These private tables remain unavailable through PostgREST. Privileged
-- SECURITY DEFINER functions perform the narrowly scoped operations below.
alter table private.user_roles force row level security;
alter table private.property_contacts force row level security;
alter table private.contact_unlocks force row level security;
alter table private.payment_intents force row level security;
alter table private.payment_config force row level security;
revoke all on all tables in schema private from public, anon, authenticated;

create policy profiles_public_read_listing_owner on public.profiles_public
  for select to anon, authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.properties p
      where p.owner_id = profiles_public.user_id
        and p.status = 'published'
    )
  );
create policy profiles_public_update_self on public.profiles_public
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy properties_read_published_anon on public.properties
  for select to anon using (status = 'published');
create policy properties_read_authenticated on public.properties
  for select to authenticated
  using (
    status = 'published'
    or owner_id = (select auth.uid())
    or (select public.has_role('admin'))
  );
create policy properties_insert_landlord on public.properties
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select public.has_role('landlord'))
    and status = 'draft'
  );
create policy properties_update_owner on public.properties
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select public.has_role('landlord')))
  with check (owner_id = (select auth.uid()) and (select public.has_role('landlord')));
create policy properties_admin_update on public.properties
  for update to authenticated
  using ((select public.has_role('admin')))
  with check ((select public.has_role('admin')));
create policy properties_delete_owner on public.properties
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select public.has_role('landlord')));
create policy properties_delete_admin on public.properties
  for delete to authenticated using ((select public.has_role('admin')));

create policy favorites_read_self on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy favorites_insert_self on public.favorites
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.properties p
      where p.id = favorites.property_id and p.status = 'published'
    )
  );
create policy favorites_delete_self on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

create policy inquiries_read_participant_or_admin on public.inquiries
  for select to authenticated
  using (
    sender_id = (select auth.uid())
    or exists (
      select 1 from public.properties p
      where p.id = inquiries.property_id and p.owner_id = (select auth.uid())
    )
    or (select public.has_role('admin'))
  );
create policy inquiries_send_to_published_listing on public.inquiries
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.properties p
      where p.id = inquiries.property_id and p.status = 'published'
    )
  );
create policy inquiries_update_owner_status on public.inquiries
  for update to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = inquiries.property_id and p.owner_id = (select auth.uid())
    )
    or (select public.has_role('admin'))
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = inquiries.property_id and p.owner_id = (select auth.uid())
    )
    or (select public.has_role('admin'))
  );

create policy property_contacts_owner_read on private.property_contacts
  for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_contacts.property_id
        and p.owner_id = (select auth.uid())
    )
    or (select public.has_role('admin'))
  );
create policy contact_unlocks_read_self on private.contact_unlocks
  for select to authenticated using (user_id = (select auth.uid()));
create policy payment_intents_read_self on private.payment_intents
  for select to authenticated using (user_id = (select auth.uid()));

-- Explicit grants: RLS does not replace SQL privileges. In particular,
-- clients cannot insert roles, publish listings, or write payment state.
revoke all on public.profiles_public, public.properties, public.favorites, public.inquiries
  from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.profiles_public to anon, authenticated;
grant update (display_name, avatar_url) on public.profiles_public to authenticated;

grant select on public.properties to anon, authenticated;
grant insert (
  slug, title, description, property_type, area, nearby,
  rent_amount_kes, rent_period, deposit_months, bedrooms, bathrooms,
  is_furnished, amenities, available_from
) on public.properties to authenticated;
grant update (
  slug, title, description, property_type, area, nearby,
  rent_amount_kes, rent_period, deposit_months, bedrooms, bathrooms,
  is_furnished, amenities, available_from
) on public.properties to authenticated;
grant delete on public.properties to authenticated;

grant select, delete on public.favorites to authenticated;
grant insert (property_id) on public.favorites to authenticated;
grant select on public.inquiries to authenticated;
grant insert (property_id, message) on public.inquiries to authenticated;
grant update (status) on public.inquiries to authenticated;

-- Owner-only private contact mutations use explicit checks and never expose
-- the private schema to the API. Admins can read through the MFA-gated RPC.
create function public.save_own_property_contact(
  p_property_id uuid,
  p_landlord_phone text,
  p_whatsapp_phone text,
  p_address_line text,
  p_building_name text default null,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not exists (
       select 1 from public.properties p
       where p.id = p_property_id and p.owner_id = (select auth.uid())
     ) then
    raise insufficient_privilege using message = 'Not allowed to edit these contacts';
  end if;

  insert into private.property_contacts (
    property_id, landlord_phone, whatsapp_phone, address_line,
    building_name, latitude, longitude
  ) values (
    p_property_id, trim(p_landlord_phone), nullif(trim(p_whatsapp_phone), ''),
    trim(p_address_line), nullif(trim(p_building_name), ''), p_latitude, p_longitude
  )
  on conflict (property_id) do update set
    landlord_phone = excluded.landlord_phone,
    whatsapp_phone = excluded.whatsapp_phone,
    address_line = excluded.address_line,
    building_name = excluded.building_name,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    updated_at = now();
end;
$$;
revoke all on function public.save_own_property_contact(uuid, text, text, text, text, numeric, numeric)
  from public, anon;
grant execute on function public.save_own_property_contact(uuid, text, text, text, text, numeric, numeric)
  to authenticated;

create function public.get_property_contact(p_property_id uuid)
returns table (
  landlord_phone text,
  whatsapp_phone text,
  address_line text,
  building_name text,
  latitude numeric,
  longitude numeric,
  unlocked_until timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.landlord_phone, c.whatsapp_phone, c.address_line, c.building_name,
         c.latitude, c.longitude,
         (select max(u.expires_at)
          from private.contact_unlocks u
          where u.user_id = (select auth.uid())
            and u.property_id = p.id
            and u.expires_at > now())
  from public.properties p
  join private.property_contacts c on c.property_id = p.id
  where p.id = p_property_id
    and (
      p.owner_id = (select auth.uid())
      or (select public.has_role('admin'))
      or (p.status = 'published' and exists (
        select 1 from private.contact_unlocks u
        where u.user_id = (select auth.uid())
          and u.property_id = p.id
          and u.expires_at > now()
      ))
    );
$$;
revoke all on function public.get_property_contact(uuid) from public, anon;
grant execute on function public.get_property_contact(uuid) to authenticated;

-- Admin-only status transition. User-controlled profile metadata and direct
-- table updates cannot publish listings or grant admin access.
create function public.admin_set_listing_status(p_property_id uuid, p_status public.property_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.has_role('admin')) then
    raise insufficient_privilege using message = 'Admin role required';
  end if;

  update public.properties
  set status = p_status,
      published_at = case when p_status = 'published' then now() else null end
  where id = p_property_id;

  if not found then
    raise no_data_found using message = 'Listing not found';
  end if;
end;
$$;
revoke all on function public.admin_set_listing_status(uuid, public.property_status) from public, anon;
grant execute on function public.admin_set_listing_status(uuid, public.property_status) to authenticated;

create function public.create_contact_payment_intent(
  p_property_id uuid
)
returns table (reference text, amount_minor integer, currency text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config private.payment_config%rowtype;
  v_user_id uuid := (select auth.uid());
  v_reference text := gen_random_uuid()::text;
  v_expires_at timestamptz;
begin
  if v_user_id is null or p_property_id is null then
    raise invalid_parameter_value using message = 'Invalid payment intent';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select * into v_config from private.payment_config where singleton;
  if not found then
    raise object_not_in_prerequisite_state using message = 'Payment pricing is not configured';
  end if;

  if not exists (
    select 1 from public.properties p
    where p.id = p_property_id
      and p.status = 'published'
      and p.owner_id <> v_user_id
  ) then
    raise insufficient_privilege using message = 'Listing is not eligible for contact unlock';
  end if;

  if exists (
    select 1 from private.contact_unlocks u
    where u.user_id = v_user_id
      and u.property_id = p_property_id
      and u.expires_at > now()
  ) then
    raise object_not_in_prerequisite_state using message = 'Contact is already unlocked';
  end if;

  if (select count(*)
      from private.payment_intents i
      where i.user_id = v_user_id
        and i.created_at > now() - interval '10 minutes'
        and i.status = 'pending') >= 3 then
    raise program_limit_exceeded using message = 'Too many payment attempts';
  end if;

  v_expires_at := now() + make_interval(mins => v_config.intent_lifetime_minutes);

  insert into private.payment_intents (
    user_id, property_id, provider_reference, amount_minor, currency, expires_at
  ) values (
    v_user_id, p_property_id, v_reference, v_config.unlock_amount_minor,
    v_config.currency, v_expires_at
  );

  return query select v_reference, v_config.unlock_amount_minor,
                      v_config.currency, v_expires_at;
end;
$$;
revoke all on function public.create_contact_payment_intent(uuid) from public, anon;
grant execute on function public.create_contact_payment_intent(uuid) to authenticated;

-- Listing photos are private objects. Clients may create short-lived signed
-- URLs only when they can read the corresponding published listing or own it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images', 'property-images', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;
revoke all on storage.objects from public, anon, authenticated;
grant select on storage.objects to anon, authenticated;
grant insert, delete on storage.objects to authenticated;

create policy property_images_public_read on storage.objects
  for select to anon
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.status = 'published'
    )
  );
create policy property_images_authenticated_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and (
          p.status = 'published'
          or p.owner_id = (select auth.uid())
          or (select public.has_role('admin'))
        )
    )
  );
create policy property_images_owner_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = (select auth.uid())
        and (select public.has_role('landlord'))
    )
  );
create policy property_images_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and (
          p.owner_id = (select auth.uid())
          or (select public.has_role('admin'))
        )
    )
  );

commit;
