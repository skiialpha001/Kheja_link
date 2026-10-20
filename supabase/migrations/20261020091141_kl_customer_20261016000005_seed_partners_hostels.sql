-- =============================================================================
-- Kheja_Link — 0005_seed_partners_hostels.sql
--
--   * the public partner directory shown under a listing
-- Rental listings and private landlord data are created by authenticated users,
-- not seeded into a public repository.
--
-- Safe to re-run. Run AFTER 0004_marketplace.sql.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Partners
--
-- logo_url is deliberately null for every company but our own. The app draws a
-- styled name tile in its place, so no third-party trademark is reproduced and
-- nobody is implied to be a partner who has not agreed to be one. Fill in
-- logo_url once an agreement exists and the tile becomes a real logo with no
-- code change.
-- -----------------------------------------------------------------------------
insert into public.partners
  (category, slug, name, tagline, brand_color, icon, phone, url, is_ours, sort_order)
values
  -- Movers ------------------------------------------------------------------
  ('movers', 'movement', 'Movement', 'Our own moving service', '#2563EB',
   'truck', null, null, true, 10),
  ('movers', 'nellions', 'Nellions', 'Household & office moving', '#0F766E',
   'truck', null, null, false, 20),
  ('movers', 'moving-solutions', 'Moving Solutions', 'Local moves in Meru', '#B45309',
   'truck', null, null, false, 30),
  ('movers', 'superior-movers', 'Superior Movers', 'Packing and transport', '#7C3AED',
   'truck', null, null, false, 40),
  ('movers', 'meru-pickups', 'Meru Pickups', 'Affordable pickup hire', '#DC2626',
   'truck', null, null, false, 50),

  -- Internet ----------------------------------------------------------------
  ('isp', 'safaricom-home', 'Safaricom Home', 'Fibre & 5G router', '#16A34A',
   'wifi', null, null, false, 10),
  ('isp', 'zuku', 'Zuku Fibre', 'Home fibre & TV', '#2563EB',
   'wifi', null, null, false, 20),
  ('isp', 'faiba', 'Faiba', 'JTL home fibre', '#EA580C',
   'wifi', null, null, false, 30),
  ('isp', 'poa-internet', 'Poa Internet', 'Low-cost home WiFi', '#0891B2',
   'wifi', null, null, false, 40),
  ('isp', 'liquid-home', 'Liquid Home', 'Fibre to the home', '#DB2777',
   'wifi', null, null, false, 50),

  -- Cleaning ----------------------------------------------------------------
  ('cleaning', 'sparkle-clean', 'Sparkle Clean', 'Move-in deep cleaning', '#0891B2',
   'sparkles', null, null, false, 10),
  ('cleaning', 'freshco-cleaners', 'FreshCo Cleaners', 'Homes & offices', '#16A34A',
   'sparkles', null, null, false, 20),
  ('cleaning', 'klin-house', 'Klin House', 'Sofa & carpet washing', '#7C3AED',
   'sparkles', null, null, false, 30),
  ('cleaning', 'meru-shine', 'Meru Shine', 'Post-construction clean', '#D97706',
   'sparkles', null, null, false, 40),
  ('cleaning', 'homecare-ke', 'HomeCare KE', 'Fumigation & sanitising', '#DC2626',
   'sparkles', null, null, false, 50)
on conflict (slug) do update
  set name        = excluded.name,
      tagline     = excluded.tagline,
      brand_color = excluded.brand_color,
      icon        = excluded.icon,
      category    = excluded.category,
      sort_order  = excluded.sort_order,
      is_ours     = excluded.is_ours;

-- -----------------------------------------------------------------------------
