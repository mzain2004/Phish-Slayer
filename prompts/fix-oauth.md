Task: Fix CSP headers and landing page redirect for PhishSlayer

Read ONLY these file:
next.config.ts
app/page.tsx

Do not read any other file.

Fix 1 — CSP headers in next.config.ts:
Find the Content-Security-Policy header string.
Add https://challenges.cloudflare.com to script-src-elem
Add https://challenges.cloudflare.com to frame-src
Add https://challenges.cloudflare.com to connect-src
Add https://accounts.phishslayer.tech to connect-src if not present
Add https://clerk.phishslayer.tech to connect-src if not present

If there is no frame-src directive add it:
frame-src 'self' https://challenges.cloudflare.com;

Do not remove any existing CSP entries — only add missing ones.

Fix 2 — Landing page in app/page.tsx:
The page should NOT immediately redirect unauthenticated users to /sign-in.
Replace current logic with this:
- If user IS authenticated (userId exists): redirect to /dashboard
- If user is NOT authenticated: render the landing page normally
  Do NOT redirect to /sign-in — let middleware handle auth protection
  The landing page should render a simple div with text Welcome to PhishSlayer
  and a link to /sign-in and a link to /sign-up
  This is temporary — proper landing page UI comes later

Run npm run build, fix all errors.
Commit: fix: CSP Cloudflare CAPTCHA headers and landing page redirect logic, push.