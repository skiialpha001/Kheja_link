-- The notification outbox is consumed by database-owned maintenance and must
-- not be directly addressable through the Data API, including with service
-- keys. SECURITY DEFINER maintenance functions run as their owner.
revoke all privileges on table public.notification_outbox
  from public, anon, authenticated, service_role;
