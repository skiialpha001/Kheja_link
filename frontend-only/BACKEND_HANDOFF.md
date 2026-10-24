# Backend handoff

The website UI currently expects the following backend capabilities. These are a checklist for the replacement API; endpoint names are suggestions, not an existing contract.

## Suggested API surface

| Area | Operations the UI needs |
| --- | --- |
| Session and profile | sign up, sign in, sign out, password reset, current user/profile, profile update, account deletion |
| Listings | search/filter/paginate published listings, listing detail, similar listings, create/update/delete own listing, update status/availability, upload images |
| Reference data | property types, Meru locations, amenities, rent bounds |
| Saved listings | list current user's favorites, add/remove favorite |
| Inquiries | send an inquiry, list own/sent inquiries, update status |
| Landlord dashboard | owned listings, counts, inquiries |
| Admin | users, listings, inquiries/messages, providers, waitlist, settings, payments/refunds, fee allocations |
| Assistant | answer a property search using public listing data |
| Payment | initialize and verify payment, payment callback/webhook, contact unlock and refund state |

## Privacy and authorization requirements

- Require server-side authentication and role/ownership checks for every private operation. Frontend route guards are only presentation.
- Public listing responses should omit landlord phone, WhatsApp, email, exact street/building address, and map pin. Return those fields only through an authorized contact-unlock flow or to the owning landlord, according to the product rules.
- A landlord must only read or modify their own listings and inquiries. A seeker must only read their own favorites and sent inquiries. Admin operations must require an explicitly authorized admin role.
- Keep payment secrets and privileged database credentials on the server. Never ship them in browser JavaScript or mobile `.env` assets.
- Validate submitted fields and uploads on the server; enforce file size/type limits and rate limits for login, inquiry, upload, and payment endpoints.

## Migration order

1. Implement the new API with the privacy/role rules above while the current app remains available.
2. Replace the website reads in `src/lib/queries/` and writes in `src/lib/actions/` with calls to the new API.
3. Move direct database calls in `src/app/admin/` behind those same API/service functions.
4. Update the Flutter data service to the new API in a later app release. Keep the old backend available until a compatible mobile update is published and enough users have upgraded.
5. Remove the legacy Supabase client, middleware, payment routes, and packages only after both clients no longer use them.
