Read ONLY these files:
- .github/workflows/deploy.yml

Task: The build-args section in the docker build step is missing Clerk URL 
variables. Find the `build-args:` block and add these lines to it 
(hardcoded values, NOT secrets):

NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://phishslayer.tech/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://phishslayer.tech/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://phishslayer.tech/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://phishslayer.tech/dashboard
NEXT_PUBLIC_APP_URL=https://phishslayer.tech
NEXT_PUBLIC_SITE_URL=https://phishslayer.tech

Add them directly under the existing build-args entries.
Do NOT use ${{ secrets.* }} for these — hardcode them.
Do NOT touch any other part of deploy.yml.
Do NOT modify server.js or middleware.ts.

After editing:
git add .github/workflows/deploy.yml
git commit -m "fix: add missing Clerk URL build-args to deploy.yml"
git push