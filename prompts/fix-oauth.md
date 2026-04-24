Read ONLY these files:
- app/layout.tsx
- next.config.js
- app/page.tsx
- middleware.ts

ISSUE 1 — Remove Termly from layout.tsx:
Delete the entire <Script> block with id="termly-blocker" that loads from app.termly.io.
Also remove the ConsentBanner import line and <ConsentBanner /> usage.
Do NOT touch any other part of layout.tsx.

ISSUE 2 — Fix CSP in next.config.js:
In the cspHeader array, make these exact changes:
- In script-src: remove https://app.termly.io, add https://*.clerk.com
- In script-src-elem: remove https://app.termly.io, add https://*.clerk.com
- In connect-src: add https://*.clerk.com after https://api.clerk.com
- In frame-src: add https://*.clerk.com
Do NOT change any other CSP directives.

ISSUE 3 — Rebuild landing page in app/page.tsx:
Replace the entire file with a proper dark SaaS landing page.
Keep the auth() check at top — if userId exists, redirect('/dashboard').
The page must include:
- Full-width hero: headline "PhishSlayer" in white, subheadline "Autonomous SOC Platform. Zero L1/L2/L3 analysts." in gray
- Three feature cards: "Autonomous Triage", "AI Threat Intel", "Zero Human L1/L2/L3" with brief descriptions
- Two CTA buttons: "Get Started Free" → /sign-up, "Sign In" → /sign-in
- Design: background #0a0a0a, accent #22d3ee (cyan), font Inter, NO rounded buttons (use rounded-none), IBM Plex Mono for any code/IOC text
- No external dependencies — use only Tailwind classes already in the project

ISSUE 4 — Fix middleware.ts:
After the isProtectedRoute block, add this logic:
If the user IS authenticated (userId exists) AND the request is for /sign-in or /sign-up, redirect them to /dashboard.
Use auth() to get userId, check against isAuthRoute matcher for ['/sign-in(.*)', '/sign-up(.*)'].

After all changes: run npm run build, fix ALL errors, commit and push.
Never modify .env. Never commit broken code.