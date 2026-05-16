# SAIMS — Session Memory (MEMO.md)
# Claude Code reads this at session start and updates it after every task.

## Current sprint: SETUP SPRINT — COMPLETE ✓

## Confirmed completed
- [x] Next.js 16.2.4 initialized — TypeScript, Tailwind CSS, App Router, Turbopack
- [x] @supabase/ssr and @supabase/supabase-js installed
- [x] .env.local created with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] Supabase environment variables added to Vercel dashboard
- [x] GitHub repo created, code pushed, Vercel auto-deploy connected
- [x] Supabase project created and provisioned
- [x] Database schema: 7 tables created (user_roles, students, companies, supervisors, applications, reports, reviews)
- [x] Row Level Security enabled on all 7 tables with policies
- [x] lib/supabase.ts created (browser client)
- [x] lib/supabase-server.ts created (server client, async cookies)
- [x] proxy.ts created with typed NextRequest parameter — route protection working
- [x] Folder structure created for all 10 pages
- [x] CLAUDE.md and MEMO.md in project root
- [x] next.config.ts updated with Unsplash + Supabase image domains
- [x] Redirect verified: /dashboard/student → /auth/login (404 expected — page not built yet)

## Next sprint: SPRINT 1 — Authentication

### Tasks in order:
1. app/auth/register/page.tsx
   - 3-step flow: Step 1 role select (Student/Company/Supervisor cards) → Step 2 role-specific form → Step 3 success screen
   - On submit: supabase.auth.signUp() → insert into user_roles → insert into role profile table (students/companies/supervisors)
   - Must handle errors: email already exists, weak password, network error
   - Design: split layout — left decorative panel, right form panel

2. app/auth/login/page.tsx
   - Email + password fields
   - On success: fetch role from user_roles table → redirect to /dashboard/[role]
   - Must handle: wrong password, unverified email, network error
   - Design: centered card with logo

3. Skeleton dashboards (just header + role label + sign out button):
   - app/dashboard/student/page.tsx
   - app/dashboard/company/page.tsx
   - app/dashboard/supervisor/page.tsx

4. components/ui/ — create reusable primitives:
   - Button.tsx (primary, ghost, danger variants)
   - Card.tsx
   - Badge.tsx (with color variants for status)
   - Input.tsx (with label and error state)
   - Spinner.tsx

### Sprint 1 acceptance criteria:
- User can register as any of the 3 roles
- Data saved in Supabase: auth.users + user_roles + profile table
- User can log in and land on correct dashboard
- Wrong role cannot access other role's dashboard (proxy.ts handles this)
- Sign out works and redirects to /

## Known issues to watch
- TypeScript strict mode is on — always type all parameters
- next.config.ts needs Unsplash domain added for images (add before Sprint 2)
- Company avg_rating needs a database trigger for auto-recalculation (add in Sprint 4 when reviews are built)
- File extensions: .tsx for React components, .ts for utilities — no .js files

## Environment
- Node: v22.2.0
- Next.js: 16.2.4 with Turbopack
- Project path: ~/Desktop/Defense projects/saims
- Local dev: http://localhost:3000
- Database: Supabase PostgreSQL, 7 tables with RLS

## How to use this file
On session start:
1. Read this file completely
2. Say: "Memo read. Setup sprint complete. Starting Sprint 1 — first task: register page."
3. After completing each task: add it to completed list, update next task
4. If session interrupted: next session reads memo and picks up exactly where you stopped
