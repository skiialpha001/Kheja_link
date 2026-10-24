set search_path = public, extensions;

-- The old seed password was published in documentation. Keep the sample
-- landlord/listings, but make password login impossible and revoke sessions.
update auth.users
   set encrypted_password = crypt(
         encode(gen_random_bytes(32), 'hex'),
         gen_salt('bf')
       ),
       banned_until = '2099-12-31 23:59:59+00'::timestamptz,
       updated_at = now()
 where lower(email) = 'demo.landlord@khejalink.co.ke';

delete from auth.sessions as s
 using auth.users as u
 where s.user_id = u.id
   and lower(u.email) = 'demo.landlord@khejalink.co.ke';
