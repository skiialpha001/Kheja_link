# Security model and integration plan

## Trust boundaries

| Data/action | Visitor | Signed-in user | Landlord/owner | Admin | Server-side payment handler |
| --- | --- | --- | --- | --- | --- |
| Published listing fields | Read | Read | Read | Read | Internal |
| Draft/owner listings | None | None | Own listings only | Read/manage with MFA | Internal |
| Landlord phone and exact address | None | Only after active paid unlock | Own listing only | Read with MFA | Internal |
| Favorites | None | Own rows | Own rows | No routine access | None |
| Inquiry content | None | Sender's own | Inquiries about own listings | Read with MFA | None |
| Role assignment | None | No direct writes | No direct writes | No direct writes | No direct writes |
| Payment state | None | Own payment intents only | No direct writes | No payment dashboard in this prototype | Checkout intent only; confirmation disabled |

Database grants and RLS enforce these boundaries. UI route guards are not treated as authorization. `private` is omitted from the Data API exposed schemas, has no client schema grants, and contains role, contact, unlock, payment-intent, and pricing data.

## Sensitive-data flow

1. Public search queries `public.properties` and returns only listing fields. No phone, email, exact street, building name, or coordinates are in that table.
2. Landlord contacts are saved through `save_own_property_contact`, which checks the authenticated owner in the database.
3. Contact lookup goes through `get_property_contact`. It returns no row unless the caller owns the listing, has an admin role with MFA (`aal2`), or has a current unlock for a published listing.
4. Listing images use a private storage bucket. Signed URLs are only available for a published listing or to its owner/admin; owners upload only into their own property folder, with a 10 MiB limit and image MIME allow-list.
5. Signup metadata can fill a display name but is never read for authorization. New users receive only the `seeker` role. The only self-service promotion is `become_landlord`; no client operation can grant admin.

## Admin provisioning

An admin must first exist as a verified Auth user. A database owner then assigns the role in `private.user_roles` from a trusted operator session. No default credential, public bootstrap endpoint, client-side role field, or admin registration route exists. Admin authorization checks the database role and `aal2`, so an admin JWT without MFA does not pass admin RLS/functions.

Use separate staff accounts, require MFA, review access regularly, and log/alert on role assignment and destructive admin operations. The prototype migration intentionally does not create the first admin.

## Payment flow required before production

1. The authenticated `contact-unlock-start` Edge Function receives a property ID, validates the caller, and calls `create_contact_payment_intent`. The database checks the listing, prevents owners from paying to unlock themselves, applies a per-user attempt limit, and chooses the amount/currency from private server configuration. The client cannot choose the amount or reference.
2. The Edge Function initializes Paystack with the server-side Paystack secret and returns only the provider checkout URL/reference. This starts checkout but never grants contact access.
3. Before billing is enabled, implement a webhook endpoint. Since Paystack cannot send a Supabase user token, its platform JWT check may be disabled only if the handler verifies Paystack's HMAC over the exact raw body using constant-time comparison, then fetches the transaction from Paystack's verification API.
4. The webhook must compare verified reference, successful status, amount, currency, and provider transaction ID against the pending intent, then perform an idempotent narrowly scoped database update. That database mutation is intentionally not implemented here; do not use Supabase's service-role key to implement it. A transaction that succeeds at the provider after its intent expires must not unlock data. Add reconciliation/refund handling and alerting before charging real users.

Never trust a browser redirect, client “payment success” status, or webhook payload by itself. Store the Paystack secret only in server-side secret storage. Do not use Supabase's service-role key; it bypasses RLS and violates this repository's security rule.

## Operational hardening before release

- Run the pgTAP suite and database lint on a fresh local stack; test web and Flutter users against the same policies.
- Configure production Auth email verification, password strength/leaked-password controls where available, short access-token lifetime, refresh-token rotation, MFA enrollment and enforcement, redirect allow-lists, CAPTCHA/rate limits for signup and recovery, and custom SMTP.
- Configure exact production redirect and CORS origins. Do not use wildcard origins with credentialed browser requests.
- Add API/function rate limits and request-size limits for inquiry, image upload, assistant, and payment initialization; the payment RPC has a narrow per-user intent cap, but that is not a general edge-function rate limiter.
- Add audit logging and alerting for admin role assignment, admin account actions, payment mismatch/replay, webhook verification failures, and repeated authorization failures. Do not log full contact data, bearer tokens, or provider secrets.
- Review private storage signed-URL expiry, backups/restore, retention and account deletion, privacy disclosures, incident response, and provider reconciliation.
- Keep frontend inputs validated with server-side allow-lists and size limits. Use parameterized database operations; do not construct SQL from user values.
- Review Supabase project network restrictions, database connection pooling, point-in-time recovery, and production access policies on the hosted project.

## Known prototype gaps

- Payment initialization is implemented, but confirmation/webhook handling is deliberately absent. Do not configure production Paystack credentials or launch unlock billing yet.
- No production search API, email delivery, assistant proxy, admin reporting API, or audit log table is included. Those need explicit request/response contracts and tests.
- The current website and Flutter app still use the old backend. This prototype is intentionally separate; it is not safe to switch clients until they are migrated and tested against it.
- A code review and local pgTAP test cannot prove the entire deployed system free of vulnerabilities. Production review must include actual project settings, secrets, policies, network controls, logs, dependencies, and the real clients.
