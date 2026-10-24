# Kheja_Link web frontend handoff

This folder is a separate copy of the website source and static assets inside the public
[skiialpha001/Kheja_link repository](https://github.com/skiialpha001/Kheja_link). The complete web
app is at the repository root, the Flutter app is in `mobile/`, and Supabase migrations are in
`supabase/`. Deployment secrets are not part of this frontend-only copy.

Project creator: **Peter Gikunju** ([gikunjucreates](https://gikunjucreates.work.gd/)).

## Important: backend adapters still need replacing

The pages and form components were built against Supabase, so this is the frontend source extraction, not yet a backend-independent runnable app. The existing integration points are:

- `src/lib/queries/` — listing, profile, lookup, favorite, inquiry, and pricing reads.
- `src/lib/actions/` — authentication, listing, inquiry, favorite, assistant, and admin writes.
- `src/lib/supabase/` — Supabase browser/server clients and generated database types.
- `src/app/admin/` — admin screens that currently query Supabase directly.
- `src/app/api/` and `src/lib/payments/` — server-side payment and scheduled-task code; remove or replace these when the new backend is chosen.
- `src/middleware.ts` — Supabase session refresh and route handling.

To connect a new backend, replace the query/action modules with calls to its API and keep the UI components/pages as the presentation layer. Enforce authorization and landlord-data privacy in the new backend; hiding fields in the UI is not a security boundary. In particular, do not return landlord phone numbers, email addresses, or exact addresses from public listing endpoints unless the access policy permits it.

This copy does not include `.env` files or credentials. The UI still uses Supabase adapters, so configure local environment variables for a preview or replace the adapters when connecting a different backend. Never copy production secrets into this folder or commit them.
