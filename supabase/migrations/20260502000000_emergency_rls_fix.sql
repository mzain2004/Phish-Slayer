-- Emergency Fix for RLS violations
-- Updates policies to use Clerk JWT 'sub' claim against user_id column

-- 1. Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING ((auth.jwt() ->> 'sub') = user_id::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING ((auth.jwt() ->> 'sub') = user_id::text)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK ((auth.jwt() ->> 'sub') = user_id::text);

-- 2. User Profiles Table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own user profile" ON public.user_profiles;
CREATE POLICY "Users can manage their own user profile"
ON public.user_profiles FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id::text)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id::text);

-- 3. Tenant Users Table
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tenant access" ON public.tenant_users;
CREATE POLICY "Users can view their own tenant access"
ON public.tenant_users FOR SELECT
USING ((auth.jwt() ->> 'sub') = user_id::text);
