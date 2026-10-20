-- =============================================================================
-- Kheja_Link — 0003_seed.sql
-- Reference data only (property types, Meru locations, amenities). No demo accounts
-- or property records are seeded, so no personal landlord details are published
-- with this public repository.
--
-- Safe to re-run: every insert is idempotent on its natural key.
-- Run AFTER 0002_rls.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Property types
-- -----------------------------------------------------------------------------
insert into public.property_types (slug, name, description, icon, sort_order) values
  ('apartment',   'Apartment',   'Self-contained units in a multi-storey block',      'Building2',   10),
  ('bedsitter',   'Bedsitter',   'Single open-plan room with its own kitchen and bath','LayoutGrid',  20),
  ('single_room', 'Single Room', 'Affordable single rooms, popular with students',     'User',        30),
  ('bungalow',    'Bungalow',    'Standalone single-storey family homes',              'Home',        40),
  ('maisonette',  'Maisonette',  'Two-storey family homes, often in a gated court',    'Home',        50),
  ('studio',      'Studio',      'Compact open-plan self-contained units',             'LayoutGrid',  60),
  ('shop',        'Shop',        'Retail and commercial premises',                     'ShoppingBag', 70),
  ('hostel',      'Hostel',      'Shared student accommodation',                       'Users',       80)
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      icon        = excluded.icon,
      sort_order  = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Locations (Meru first — the county column keeps this Kenya-wide ready)
-- -----------------------------------------------------------------------------
insert into public.locations (slug, name, area, county, latitude, longitude) values
  ('makutano',   'Makutano',   'Meru Town',   'Meru',  0.056000, 37.655000),
  ('meru-town',  'Meru Town',  'Central',     'Meru',  0.047400, 37.649900),
  ('nkubu',      'Nkubu',      'Imenti South','Meru', -0.061000, 37.665000),
  ('kinoru',     'Kinoru',     'Meru Town',   'Meru',  0.061000, 37.636000),
  ('milimani',   'Milimani',   'Meru Town',   'Meru',  0.052000, 37.643000),
  ('must-area',  'MUST Area',  'Nchiru',      'Meru',  0.083000, 37.593000),
  ('gitoro',     'Gitoro',     'Meru Town',   'Meru',  0.075000, 37.680000),
  ('kaaga',      'Kaaga',      'Meru Town',   'Meru',  0.070000, 37.660000)
on conflict (slug) do update
  set name      = excluded.name,
      area      = excluded.area,
      county    = excluded.county,
      latitude  = excluded.latitude,
      longitude = excluded.longitude;

-- -----------------------------------------------------------------------------
-- Amenities
-- -----------------------------------------------------------------------------
insert into public.amenities (slug, name, icon, sort_order) values
  ('water',        'Constant Water',   'Droplets',    10),
  ('electricity',  'Prepaid Tokens',   'Zap',         20),
  ('parking',      'Parking',          'Car',         30),
  ('security',     '24/7 Security',    'ShieldCheck', 40),
  ('wifi',         'WiFi Ready',       'Wifi',        50),
  ('borehole',     'Borehole',         'Waves',       60),
  ('cctv',         'CCTV',             'Cctv',        70),
  ('balcony',      'Balcony',          'Sun',         80),
  ('lift',         'Lift',             'MoveVertical',90),
  ('gated',        'Gated Community',  'Fence',      100),
  ('furnished',    'Furnished',        'Sofa',       110),
  ('backup_power', 'Backup Generator', 'BatteryCharging', 120)
on conflict (slug) do update
  set name       = excluded.name,
      icon       = excluded.icon,
      sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
