Task: Replace Supabase auth in app/page.tsx with Clerk for PhishSlayer

Read ONLY these files:
app/page.tsx
middleware.ts

Do not read any other file.

The current app/page.tsx contains manual auth forms using:
- supabase.auth.signInWithOAuth
- supabase.auth.signInWithPassword
- supabase.auth.signUp
- supabase.auth.resetPasswordForEmail

Remove ALL of this. PhishSlayer uses Clerk exclusively for auth.

Replace the entire page.tsx with a clean landing page that:
1. Checks if user is authenticated via Clerk:
   import { auth } from '@clerk/nextjs/server'
   const { userId } = await auth()
2. If userId exists: redirect to /dashboard
3. If not authenticated: redirect to /sign-in
4. The page itself renders nothing — it is purely a redirect handler

Also verify middleware.ts has these public routes:
   publicRoutes: ['/', '/sign-in', '/sign-up', '/api/webhooks/clerk', '/api/ingest', '/api/ingest/batch']
If missing add them without changing anything else in middleware.ts.

Run npm run build, fix all errors.
Commit: fix: replace supabase auth with Clerk redirects in page.tsx, push.