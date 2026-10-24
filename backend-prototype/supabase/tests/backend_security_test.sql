begin;
select plan(33);

-- Stable fixtures use isolated IDs and roll back at the end of the test.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@example.invalid', 'x', now(), '{"provider":"email"}', '{"full_name":"Owner A","role":"landlord"}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@example.invalid', 'x', now(), '{"provider":"email"}', '{"full_name":"Owner B"}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seeker@example.invalid', 'x', now(), '{"provider":"email"}', '{"full_name":"Seeker"}', now(), now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.invalid', 'x', now(), '{"provider":"email"}', '{"full_name":"Admin"}', now(), now()),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'attacker@example.invalid', 'x', now(), '{"provider":"email"}', '{"full_name":"Attacker","role":"admin"}', now(), now());

insert into private.user_roles (user_id, role) values
  ('10000000-0000-0000-0000-000000000001', 'landlord'),
  ('10000000-0000-0000-0000-000000000002', 'landlord'),
  ('10000000-0000-0000-0000-000000000004', 'admin');

insert into public.properties (
  id, owner_id, slug, title, property_type, area, rent_amount_kes, status, published_at
) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner-a-home', 'Owner A home', 'apartment', 'Meru Town', 12000, 'published', now()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'owner-a-draft', 'Owner A draft', 'bedsitter', 'Makutano', 8000, 'draft', null),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'owner-b-home', 'Owner B home', 'house', 'Nkubu', 25000, 'published', now());

insert into private.property_contacts (
  property_id, landlord_phone, address_line, building_name
) values
  ('20000000-0000-0000-0000-000000000001', '+254700000001', '12 Private Street', 'Private House A'),
  ('20000000-0000-0000-0000-000000000003', '+254700000002', '48 Private Road', 'Private House B');

insert into private.contact_unlocks (
  user_id, property_id, payment_reference, paid_at, expires_at
) values (
  '10000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000003',
  'expired-reference', now() - interval '5 hours', now() - interval '2 hours'
);

insert into private.payment_config (singleton, unlock_amount_minor, currency)
values (true, 50000, 'KES');

select ok(
  not exists (
    select 1 from pg_class c
    where c.oid in (
      'public.profiles_public'::regclass,
      'public.properties'::regclass,
      'public.favorites'::regclass,
      'public.inquiries'::regclass,
      'private.user_roles'::regclass,
      'private.property_contacts'::regclass,
      'private.contact_unlocks'::regclass,
      'private.payment_intents'::regclass,
      'private.payment_config'::regclass
    ) and not c.relrowsecurity
  ), 'RLS is enabled on every application table'
);
select ok(not has_schema_privilege('anon', 'private', 'USAGE'), 'anonymous API role cannot address the private schema');
select ok(not has_schema_privilege('authenticated', 'private', 'USAGE'), 'signed-in API role cannot address the private schema');
select ok(not has_table_privilege('anon', 'private.property_contacts', 'SELECT'), 'anonymous API role cannot select contact data');
select ok(not has_table_privilege('authenticated', 'private.property_contacts', 'SELECT'), 'signed-in API role cannot select contact data directly');
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'properties'
      and column_name in ('landlord_phone', 'whatsapp_phone', 'address_line', 'building_name', 'latitude', 'longitude')
  ), 'public listings contain no private contact or exact-location columns'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles_public'
      and column_name in ('phone', 'email', 'role')
  ), 'public profiles contain no phone, email, or authorization role'
);
select ok(not has_function_privilege('anon', 'public.get_property_contact(uuid)', 'EXECUTE'), 'anonymous users cannot invoke the contact RPC');
select ok(has_function_privilege('authenticated', 'public.get_property_contact(uuid)', 'EXECUTE'), 'signed-in users can request an entitlement-checked contact RPC');
select ok(not exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'confirm_contact_payment'
), 'payment confirmation remains disabled until a narrowly scoped webhook is implemented');
select ok(not has_column_privilege('authenticated', 'public.properties', 'status', 'UPDATE'), 'landlords cannot publish by updating status directly');
select ok(not has_column_privilege('authenticated', 'public.properties', 'owner_id', 'UPDATE'), 'landlords cannot reassign listing ownership');
select ok(not has_table_privilege('anon', 'public.inquiries', 'INSERT'), 'anonymous visitors cannot submit PII-bearing inquiries');

select is(
  (select count(*) from private.user_roles
   where user_id = '10000000-0000-0000-0000-000000000005' and role = 'admin'),
  0::bigint, 'signup role metadata did not create an admin'
);
select is(
  (select count(*) from private.user_roles
   where user_id = '10000000-0000-0000-0000-000000000005' and role = 'seeker'),
  1::bigint, 'signup created only the default seeker role'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*) from public.properties), 2::bigint, 'anonymous readers see only published listings');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is((select count(*) from public.properties), 2::bigint, 'seeker cannot read a landlord draft');
select is((select count(*) from public.get_property_contact('20000000-0000-0000-0000-000000000001')), 0::bigint, 'seeker cannot read contacts before unlock');
select is((select count(*) from public.get_property_contact('20000000-0000-0000-0000-000000000003')), 0::bigint, 'expired unlock does not reveal contact data');
select is((select public.has_role('admin')), false, 'a normal authenticated user is not an admin');
select is((select public.has_role('landlord')), false, 'a seeker is not a landlord before opting in');
select lives_ok('select public.become_landlord()', 'a signed-in seeker may opt into landlord features');
select is((select public.has_role('landlord')), true, 'landlord opt-in grants only the landlord role');
select is((select public.has_role('admin')), false, 'landlord opt-in cannot grant the admin role');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is((select count(*) from public.get_property_contact('20000000-0000-0000-0000-000000000001')), 1::bigint, 'listing owner can read their own private contact details');
select throws_ok(
  $$insert into public.properties (slug, title, description, property_type, area, rent_amount_kes)
    values ('leaked-number-test', 'Private phone', 'Call +254700000099', 'house', 'Meru Town', 12000)$$,
  '23514', 'Remove phone numbers and email addresses from public text',
  'public listing text rejects obvious phone-number leakage'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}', true);
select is((select count(*) from public.get_property_contact('20000000-0000-0000-0000-000000000001')), 0::bigint, 'another landlord cannot read the first landlord contact details');

reset role;
insert into private.contact_unlocks (
  user_id, property_id, payment_reference, paid_at, expires_at
) values (
  '10000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000001',
  'valid-reference', now(), now() + interval '3 hours'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is((select landlord_phone from public.get_property_contact('20000000-0000-0000-0000-000000000001')), '+254700000001', 'only a paid active unlock returns contact details');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal1"}', true);
select is((select public.has_role('admin')), false, 'admin actions require aal2 MFA');
select throws_ok(
  $$select public.admin_set_listing_status('20000000-0000-0000-0000-000000000002', 'published')$$,
  '42501', 'Admin role required', 'admin with only aal1 cannot publish a listing'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}', true);
select is((select public.has_role('admin')), true, 'admin role is active only after aal2 MFA');
select is((select count(*) from public.properties), 3::bigint, 'MFA-verified admin can review unpublished listings');
select lives_ok(
  $$select public.admin_set_listing_status('20000000-0000-0000-0000-000000000002', 'published')$$,
  'MFA-verified admin can publish a listing through the guarded function'
);

select * from finish();
rollback;
