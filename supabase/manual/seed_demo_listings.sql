-- One-time production preview data. Run only after the demo_listing_safety
-- migration has been applied. The reserved .invalid Auth account cannot receive
-- mail; its password was generated once and discarded.
begin;

-- Keep the Premium tab at six sample entries as well.
update public.properties
   set is_premium = true
 where is_demo = true and slug = 'demo-bedsitter-meru-town-studio';

do $$
declare
  v_owner uuid;
  v_type uuid;
  v_location uuid;
  v_property uuid;
  r record;
begin
  select u.id into v_owner
    from auth.users u
    join public.profiles p on p.id = u.id
   where u.email = 'demo-listings@khejalink.invalid'
     and p.role = 'landlord'
     and p.is_verified = false
     and p.phone is null;

  if v_owner is null then
    raise exception 'The isolated demo landlord profile is missing or does not match the safety checks.';
  end if;

  for r in
    select * from (values
      ('demo-apartment-makutano-one-bedroom', 'DEMO · Makutano One-Bedroom Apartment', 'apartment', 'makutano',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Illustrates a compact one-bedroom layout with a separate living area and kitchenette.',
       18500, 1, 1, 560, false, false, 0, false, false, false, true, 1,
       'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200'),
      ('demo-apartment-kinoru-two-bedroom', 'DEMO · Kinoru Two-Bedroom Apartment', 'apartment', 'kinoru',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Shows a two-bedroom sample layout with a shared living and dining space.',
       24000, 2, 1, 850, false, true, 1, false, true, true, true, 1,
       'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200'),
      ('demo-apartment-meru-town-three-bedroom', 'DEMO · Meru Town Three-Bedroom Apartment', 'apartment', 'meru-town',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Illustrates a three-bedroom family layout with two sample bathrooms and a larger living room.',
       36000, 3, 2, 1240, true, false, 1, false, false, true, false, 2,
       'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200'),
      ('demo-apartment-nkubu-two-bedroom', 'DEMO · Nkubu Two-Bedroom Flat', 'apartment', 'nkubu',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Illustrates a simple two-bedroom flat with a smaller footprint.',
       17200, 2, 1, 790, false, false, 0, true, false, false, false, 1,
       'https://images.unsplash.com/photo-1536376074432-bf12406b4b74?auto=format&fit=crop&q=80&w=1200'),
      ('demo-apartment-kaaga-family-two-bedroom', 'DEMO · Kaaga Family Two-Bedroom Apartment', 'apartment', 'kaaga',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Shows a sample two-bedroom layout with a balcony and space for a small dining table.',
       28500, 2, 2, 980, true, true, 1, false, true, true, true, 2,
       'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=1200'),

      ('demo-shop-makutano-small-unit', 'DEMO · Makutano Small Shop Unit', 'shop', 'makutano',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Illustrates a small retail floor plan suited to testing commercial listing cards.',
       8200, 0, 0, 110, false, false, 0, false, false, false, false, 1,
       'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200'),
      ('demo-shop-meru-town-streetfront', 'DEMO · Meru Town Streetfront Shop', 'shop', 'meru-town',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Sample details describe an open retail unit and front display area for layout testing.',
       16800, 0, 0, 230, false, false, 0, false, false, false, false, 1,
       'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=1200'),
      ('demo-shop-nkubu-corner-unit', 'DEMO · Nkubu Corner Shop Unit', 'shop', 'nkubu',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Example commercial listing with a compact sales floor and a sample stock room.',
       12500, 0, 0, 175, false, true, 0, false, false, false, false, 1,
       'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200'),
      ('demo-shop-kinoru-commercial-unit', 'DEMO · Kinoru Commercial Unit', 'shop', 'kinoru',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Larger sample commercial floor plan for comparing shop sizes and price displays.',
       21800, 0, 0, 320, true, false, 1, false, false, true, true, 2,
       'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=1200'),
      ('demo-shop-kaaga-workspace', 'DEMO · Kaaga Small Shop Space', 'shop', 'kaaga',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Compact commercial example with room for a counter and a few shelves.',
       9700, 0, 0, 135, false, false, 0, false, false, false, false, 1,
       'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200'),
      ('demo-shop-gitoro-retail-unit', 'DEMO · Gitoro Retail Unit', 'shop', 'gitoro',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Mid-size sample commercial listing with a separate illustrative stock area.',
       15100, 0, 0, 205, false, true, 1, false, false, true, false, 1,
       'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=1200'),

      ('demo-room-must-area-single', 'DEMO · MUST Area Single Room', 'single_room', 'must-area',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Student-room sample with a simple sleeping area and shared-facility layout.',
       4800, 1, 1, 125, false, false, 0, false, false, true, true, 1,
       'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200'),
      ('demo-room-kaaga-single', 'DEMO · Kaaga Single Room', 'single_room', 'kaaga',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Small single-room sample with room for a bed, desk, and storage.',
       5200, 1, 1, 135, false, true, 0, false, false, false, false, 1,
       'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=1200'),
      ('demo-room-meru-town-single', 'DEMO · Meru Town Single Room', 'single_room', 'meru-town',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Illustrates a slightly larger single-room layout with a work corner.',
       6200, 1, 1, 155, false, false, 0, true, false, false, true, 1,
       'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?auto=format&fit=crop&q=80&w=1200'),
      ('demo-room-nkubu-single', 'DEMO · Nkubu Single Room', 'single_room', 'nkubu',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Compact room example for testing search filters and card density.',
       4600, 1, 1, 120, true, false, 0, false, false, false, false, 1,
       'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1200'),
      ('demo-room-milimani-single', 'DEMO · Milimani Single Room', 'single_room', 'milimani',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Single-room sample with a simple bed and desk layout.',
       5500, 1, 1, 140, false, false, 0, false, false, false, false, 1,
       'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=1200'),
      ('demo-room-gitoro-single', 'DEMO · Gitoro Single Room', 'single_room', 'gitoro',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Slightly larger single-room layout for comparing space and rent displays.',
       5900, 1, 1, 150, false, true, 0, false, false, true, true, 1,
       'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?auto=format&fit=crop&q=80&w=1200'),

      ('demo-bedsitter-makutano-compact', 'DEMO · Makutano Compact Bedsitter', 'bedsitter', 'makutano',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Open-plan sample with a combined sleeping and living area and a kitchenette.',
       11800, 1, 1, 335, false, false, 0, false, false, true, false, 1,
       'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200'),
      ('demo-bedsitter-kinoru-balcony', 'DEMO · Kinoru Bedsitter with Balcony', 'bedsitter', 'kinoru',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Open-plan sample with a balcony and extra storage space.',
       13400, 1, 1, 385, true, true, 1, false, true, true, true, 1,
       'https://images.unsplash.com/photo-1536376074432-bf12406b4b74?auto=format&fit=crop&q=80&w=1200'),
      ('demo-bedsitter-meru-town-studio', 'DEMO · Meru Town Bedsitter', 'bedsitter', 'meru-town',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Smaller self-contained layout example for testing compact listing cards.',
       10900, 1, 1, 300, false, false, 0, true, false, false, false, 1,
       'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200'),
      ('demo-bedsitter-kaaga-self-contained', 'DEMO · Kaaga Self-Contained Bedsitter', 'bedsitter', 'kaaga',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Sample self-contained layout with an illustrative wardrobe and kitchenette.',
       12800, 1, 1, 360, false, true, 1, false, false, true, true, 2,
       'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200'),
      ('demo-bedsitter-nkubu-simple', 'DEMO · Nkubu Simple Bedsitter', 'bedsitter', 'nkubu',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Simple open-plan sample with a compact living and sleeping area.',
       11500, 1, 1, 325, false, false, 0, true, false, false, false, 1,
       'https://images.unsplash.com/photo-1536376074432-bf12406b4b74?auto=format&fit=crop&q=80&w=1200'),
      ('demo-bedsitter-milimani-bright', 'DEMO · Milimani Bright Bedsitter', 'bedsitter', 'milimani',
       'DEMO DATA — fictional example for interface testing only. Not a real rental. Do not visit, contact, or send money. Bright open-plan sample with a separate kitchenette corner.',
       12200, 1, 1, 345, false, true, 0, false, false, false, true, 1,
       'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200')
    ) as listings(slug, title, type_slug, location_slug, description,
                  price_amount, bedrooms, bathrooms, size_sqft, is_premium,
                  is_furnished, parking_spaces, pets_allowed, has_balcony,
                  is_gated, internet_ready, deposit_months, image_url)
  loop
    select id into v_type from public.property_types where slug = r.type_slug;
    select id into v_location from public.locations where slug = r.location_slug;
    if v_type is null or v_location is null then
      raise exception 'Demo listing reference data is missing for slug %.', r.slug;
    end if;

    v_property := null;
    insert into public.properties (
      owner_id, title, slug, description, property_type_id, location_id,
      nearby, price_amount, price_currency, price_period, deposit_months,
      bedrooms, bathrooms, size_sqft, is_premium, is_demo, is_furnished,
      status, availability, available_from, published_at, parking_spaces,
      pets_allowed, has_balcony, is_gated, internet_ready,
      address_line, building_name, contact_phone, contact_whatsapp,
      landlord_name, caretaker_name, caretaker_phone, latitude, longitude
    ) values (
      v_owner, r.title, r.slug, r.description, v_type, v_location,
      'Demo area only; no real address is provided.', r.price_amount, 'KES', 'month', r.deposit_months,
      r.bedrooms, r.bathrooms, r.size_sqft, r.is_premium, true, r.is_furnished,
      'published', 'unavailable', null, now(), r.parking_spaces,
      r.pets_allowed, r.has_balcony, r.is_gated, r.internet_ready,
      null, null, null, null, null, null, null, null, null
    )
    on conflict (slug) do nothing
    returning id into v_property;

    if v_property is null then
      select id into v_property from public.properties
       where slug = r.slug and owner_id = v_owner and is_demo;
      if v_property is null then
        raise exception 'A non-demo listing already uses reserved slug %.', r.slug;
      end if;
    end if;

    insert into public.property_images (property_id, public_url, alt_text, is_cover, sort_order)
    select v_property, r.image_url, 'Illustrative demo photo; not this property.', true, 0
     where not exists (
       select 1 from public.property_images i where i.property_id = v_property and i.is_cover
     );
  end loop;
end;
$$;

commit;
