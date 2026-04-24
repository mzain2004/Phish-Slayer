Task: Fix CSP blocking Google Fonts on sign-in page

Read ONLY this file:
- next.config.ts (or next.config.js — check which exists)

In the Content-Security-Policy header, find the style-src directive and add these two domains:
https://fonts.googleapis.com
https://fonts.gstatic.com

Also add to font-src directive:
https://fonts.googleapis.com
https://fonts.gstatic.com

Do not touch anything else in the file.
Run npm run build, fix all errors.
Commit: fix: add Google Fonts to CSP style-src and font-src, push.