# Kheja_Link web frontend handoff

This folder is a separate copy of the website source and its static assets. The original project remains unchanged. The Flutter app, Supabase migrations, and deployment secrets are not part of this copy.

## Important: backend adapters still need replacing

The pages and form components were built against Supabase, so this is the frontend source extraction, not yet a backend-independent runnable app. The existing integration points are:

- `src/lib/queries/` — listing, profile, lookup, favorite, inquiry, and pricing reads.
- `src/lib/actions/` — authentication, listing, inquiry, favorite, assistant, and admin writes.
- `src/lib/supabase/` — Supabase browser/server clients and generated database types.
- `src/app/admin/` — admin screens that currently query Supabase directly.
- `src/app/api/` and `src/lib/payments/` — server-side payment and scheduled-task code; remove or replace these when the new backend is chosen.
- `src/middleware.ts` — Supabase session refresh and route handling.

To connect a new backend, replace the query/action modules with calls to its API and keep the UI components/pages as the presentation layer. Enforce authorization and landlord-data privacy in the new backend; hiding fields in the UI is not a security boundary. In particular, do not return landlord phone numbers, email addresses, or exact addresses from public listing endpoints unless the access policy permits it.

This copy does not include `.env` files or credentials. The current UI integration still references Supabase, so configure the old service only if you need to preview it before replacing the adapters.
