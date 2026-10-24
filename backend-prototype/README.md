# Kheja_Link secure backend prototype

This is an isolated Supabase/Postgres prototype for the web and Flutter clients. It does not change the current app or the existing Supabase migrations. It is a security-oriented starting point, not a claim that software can be made vulnerability-free or a production-ready payment integration.

## What is included

- `supabase/config.toml` — local auth, MFA, API exposure and upload limits.
- `supabase/migrations/20261015200036_secure_core.sql` — minimal schema, RLS, column grants, private contact/payment tables, and guarded RPCs.
- `supabase/functions/contact-unlock-start/index.ts` — authenticated Paystack checkout initialization; it cannot grant contact access.
- `supabase/tests/backend_security_test.sql` — pgTAP checks for access boundaries, signup role escalation, contact privacy, and admin MFA.
- `SECURITY_MODEL.md` — data flow, payment protocol, deployment checklist, and known gaps.

The directory is separate from the current `supabase/` folder. Do not point this prototype at production or apply its migration to your current backend without reviewing the migration and planning a data migration.

## Local verification

The Supabase CLI is required. These commands start a disposable local stack and apply only this prototype:

```powershell
supabase start --workdir backend-prototype
supabase test db --local --workdir backend-prototype
supabase db lint --local --workdir backend-prototype
```

The local stack could not be started in the current environment because Docker is not installed. The pgTAP suite is included but has not been executed here. Do not deploy until it passes against a fresh local database and the production security review is complete.

## First admin

There is no default admin and no sign-up parameter can create one. After the intended admin has registered and verified their email, a database owner must assign the role through a restricted operator session, for example:

```sql
insert into private.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'the-verified-admin-email@example.com'
on conflict (user_id, role) do nothing;
```

Run this only after substituting the verified admin address and reviewing the target row. The SQL editor/database owner is privileged access; there is deliberately no unauthenticated or public “create admin” endpoint. Admin actions also require an MFA-authenticated (`aal2`) session.

## Payments are not ready to launch

The `contact-unlock-start` Edge Function authenticates a verified user, creates a server-priced payment intent, and initializes Paystack. It does not grant contact access. Payment confirmation and the webhook are intentionally not implemented: complete them only with a narrowly scoped, signature-verified, provider-verified webhook design that does not use Supabase's service-role key. Never trust a client success screen or webhook JSON alone. The Paystack secret belongs in server-side secret storage. Confirm Paystack's currency units and production pricing before inserting `private.payment_config`.
