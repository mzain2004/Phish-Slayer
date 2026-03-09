# 🛡️ System Architecture & Rules: Project Phish-Slayer / Cyber Auto-Scanner

## 1. Project Overview

This project is an automated, high-scale cybersecurity vulnerability scanner and reporting tool. It is designed to handle thousands of requests using a serverless event-driven architecture.

## 2. Tech Stack Requirements (DO NOT DEVIATE)

- **Frontend:** Next.js (React), Tailwind CSS, shadcn/ui.
- **Backend/API:** Google Cloud Functions (or Next.js API routes for MVP).
- **Database & Auth:** Supabase (PostgreSQL).
- **AI Engine:** Local Ollama API endpoint or free-tier LLM API.
- **Automation:** n8n webhooks.

## 3. Coding Standards (The "Ruthless" Rules)

- **No Dummy Code:** Never use `console.log("here")` or `// Add logic later`. Write the actual logic. If you are missing an API key, write the code to fetch it from `.env`.
- **Security First:** All inputs from the frontend MUST be sanitized. Never trust user input. Assume every user is trying to inject SQL.
- **Modularity:** Do not dump everything into `page.tsx`. Separate UI components, API calls, and database logic into distinct folders (`/components`, `/lib`, `/api`).
- **Error Handling:** Never swallow errors. If an API call to AlienVault or a scanning tool fails, return a clean JSON error response that the frontend can display to the user.

## 4. Execution Workflow

1.  **Plan First:** Before writing any code, outline the file structure and logic in a checklist artifact. Wait for user approval.
2.  **Execute:** Write the code strictly following the approved plan.
3.  **Verify:** Use the Antigravity Browser Agent to test the UI and API endpoints. Consol erorrs should be captured.
