Task: Add CLERK_WEBHOOK_SECRET to GitHub Actions deploy workflow env block

Read ONLY .github/workflows/deploy.yml
Do not read any other file.

In the "Writing environment file" step inside deploy-azure job,
add this line to the env block before ENVEOF:
CLERK_WEBHOOK_SECRET=${{ secrets.CLERK_WEBHOOK_SECRET }}

Do not change anything else.
Commit: fix(ci): add CLERK_WEBHOOK_SECRET to deploy env and push.