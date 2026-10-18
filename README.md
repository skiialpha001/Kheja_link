# Kheja_Link Customer Web

The customer-facing Kheja_Link website for rental discovery in Meru, Kenya. It includes seeker and landlord experiences, the Supabase-backed application flows, and the payment handlers used to unlock listing contact details. The administrator interface, Flutter app, and separate unfinished backend prototype are not included.

## Included features

- Browse, search, filter, and paginate rental listings.
- Sign up, sign in, manage a profile, and delete an account.
- Save listings and send inquiries.
- Landlord dashboard for creating and managing listings, photos, and inquiries.
- Contact-unlock payments, payment status, and provider webhook handling.
- Property search assistant and public reference data for Meru locations, property types, and amenities.

## Stack

- Next.js App Router, React, and TypeScript.
- Supabase Auth, PostgreSQL, Storage, and Row Level Security.
- Paystack payment processing.
- Vercel deployment.

## Run the website

1. Install Node.js and npm.
2. Copy .env.example to .env.local and set the Supabase URL and publishable/anon key.
3. Set NEXT_PUBLIC_SITE_URL to the local or deployed site URL.
4. Install dependencies with npm install.
5. Start the development server with npm run dev.

Set the production site URL and Supabase Auth redirect URLs in Supabase before deploying. Add PAYSTACK_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY to the Vercel server-side environment only; do not expose either in browser variables or commit their values. Keep PAYMENTS_DEMO_MODE=false in production.

## Supabase setup and migration safety

supabase/migrations contains a clean-database baseline for the customer application. The seed migrations add reference and partner directory data only; they do not create demo users, sample rental properties, landlord phone numbers, or exact property locations.

Do not apply this full baseline to the existing production Supabase project. That project already has its schema and live data, and its migration history may not match these baseline files. To run this clone against the existing backend, configure its URL and public key in .env.local and leave the database unchanged. To create a separate backend, first use a fresh Supabase project and review the baseline against that project before applying it.

Listing contact fields and precise locations are guarded by database permissions and the contact-unlock/owner RPCs. Public listing pages must use the safe listing reads; never add phone, email, exact address, or map coordinates to public responses. Keep authorization in RLS and server-side payment code. The service-role key must stay server-only.

## Repository scope

This copy intentionally excludes the /admin routes, admin-only components/actions, the scheduled keep-alive endpoint, Flutter sources, and the separate prototype backend. Customer-facing landlord management remains available under /dashboard.

