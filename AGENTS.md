# Customer web project

This repository contains the public customer and landlord website only. Do not add administrator routes or admin controls to this app. Do not copy Flutter sources into this repository.

## Security requirements

- Supabase Row Level Security is the authorization boundary. UI guards are not authorization.
- Never expose service_role, Paystack secret, or other privileged credentials in browser code or NEXT_PUBLIC_* variables.
- Public listing results must not return landlord phone, WhatsApp, email, exact street/building address, or map coordinates. Use the guarded owner/contact-unlock RPC for permitted access.
- A landlord may read or modify only their own listings and inquiries; a seeker may read only their own favorites and sent inquiries.
- Validate writes with the existing Zod schemas in src/lib/validation.ts and keep database-backed actions on the server.
- Keep error, loading, and empty states for database-backed customer flows.

## Architecture

- src/app/ contains Next.js routes and server-rendered pages.
- src/lib/queries/ contains Supabase reads; src/lib/actions/ contains server actions.
- src/app/api/payments/ contains server-side payment handlers.
- src/lib/supabase/ contains browser/server clients and database types.
- supabase/migrations/ contains the reviewed clean-database baseline. Do not apply it to an existing production project without checking migration history first.
