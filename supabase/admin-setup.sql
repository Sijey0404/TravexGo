-- Create the first administrator without a hardcoded password:
-- 1. Create the administrator through Supabase Auth (Dashboard or invite flow).
-- 2. Copy the auth.users UUID for that account.
-- 3. Run this statement in the Supabase SQL editor after replacing the UUID.
-- Do not expose a service-role key or put administrator credentials in source control.
update public.profiles
   set role = 'administrator', account_status = 'active'
 where id = '00000000-0000-0000-0000-000000000000'::uuid;