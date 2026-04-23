Task: Wire Wazuh active response API endpoints

Create these 3 files only:
app/api/response/isolate/route.ts
app/api/response/kill-process/route.ts
app/api/response/quarantine/route.ts

Wazuh Manager API base URL is http://167.172.85.62:55000
Auth via WAZUH_API_USER and WAZUH_API_PASSWORD from env
Each route: auth check then Zod validation then call Wazuh API then log to case timeline
All routes need dynamic and runtime exports
Do not touch any other file.
Run npm run build, fix errors, commit: feat: Wazuh active response, push.