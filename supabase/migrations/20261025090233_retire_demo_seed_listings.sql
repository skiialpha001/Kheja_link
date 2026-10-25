-- The historical seed remains in the migration chain for reproducible
-- development databases. Keep its sample properties out of the live directory
-- in both fresh installs and existing deployments; preserve the rows so an
-- administrator can recover or inspect them if necessary.
update public.properties as p
   set status = 'archived'::public.property_status,
       updated_at = pg_catalog.now()
  from auth.users as u
 where p.owner_id = u.id
   and pg_catalog.lower(u.email) = 'demo.landlord@khejalink.co.ke'
   and p.status <> 'archived'::public.property_status;
