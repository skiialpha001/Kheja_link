-- Disabled for safety.
--
-- The historical version of this file deleted real user accounts, listings,
-- messages, and payment records while retaining seeded demo listings. It must
-- not be used to prepare or clean a production database. Keep this guard so an
-- old runbook or copied dashboard instruction cannot execute the former reset.
do $guard$
begin
  raise exception 'This reset script is disabled. Preserve live user and payment data; use reviewed forward migrations.';
end;
$guard$;
