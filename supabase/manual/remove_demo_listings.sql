-- Reversible cleanup for the temporary preview dataset. Run manually only when
-- the sample listings are no longer needed. This deletes only listings owned
-- by the dedicated .invalid demo profile and explicitly marked is_demo.
begin;

delete from public.properties p
 using auth.users u
 where p.owner_id = u.id
   and u.email = 'demo-listings@khejalink.invalid'
   and p.is_demo = true
   and p.slug like 'demo-%';

commit;
