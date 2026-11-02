-- The customer listing query needs this non-sensitive flag so demo rows can be
-- clearly labelled and excluded from canonical/SEO output. Existing RLS
-- policies continue to limit which property rows anon/authenticated can read.
begin;

grant select (is_demo)
  on table public.properties
  to anon, authenticated;

commit;
