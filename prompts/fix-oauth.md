Task: Create case management API routes

Create these 3 files only:
app/api/cases/route.ts with GET list and POST create
app/api/cases/[id]/route.ts with GET single and PATCH update
app/api/cases/[id]/timeline/route.ts with GET and POST

All routes need dynamic and runtime exports
Auth: const userId from auth() from @clerk/nextjs/server
Zod validation on all POST and PATCH payloads
Do not touch any other file.
Run npm run build, fix errors, commit: feat: case management API, push.