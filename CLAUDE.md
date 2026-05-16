# SAIMS — Student Attachment and Internship Management System (AttachHub)

## CRITICAL FIRST STEP — Every session
1. Read `MEMO.md` in this project root before doing ANYTHING
2. Tell the developer: "I've read the memo. Current sprint: [X]. Last completed: [Y]. Next task: [Z]."
3. After completing each task, update MEMO.md immediately
4. Never start a new task without updating MEMO.md for the previous one

## Project identity
- **Product name:** AttachHub
- **Full name:** Student Attachment and Internship Management System (SAIMS)
- **Purpose:** Web platform for university students in Bamenda, Cameroon to find, apply for, and manage mandatory industrial attachments
- **Academic context:** BSc final year dissertation at College of Technology (COLTECH), University of Bamenda. Must have a live deployed URL for defense demonstration.
- **Developer:** Steph-Bryan — understands code, debugs independently, works with AI assistance. Treat as professional junior developer.

## Tech stack
- **Framework:** Next.js 16.x — App Router, TypeScript, Turbopack
- **Styling:** Tailwind CSS — utility-first, dark mode only
- **Database:** Supabase — PostgreSQL with Row Level Security
- **Auth:** Supabase Auth — email + password, session managed via cookies
- **Deployment:** Vercel — auto-deploy from GitHub main branch
- **Version control:** GitHub

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=        (set in .env.local and Vercel)
NEXT_PUBLIC_SUPABASE_ANON_KEY=   (set in .env.local and Vercel)
```
Security rule: Never hardcode these. Never log them. Never expose SERVICE_ROLE key client-side.

## Three user roles
1. Student — browse companies, apply for slots, track application status, submit weekly reports, view supervisor feedback
2. Company — post internship slots, review and manage applicants, accept/decline applications, review intern weekly reports
3. Supervisor — view all assigned students, monitor placement status and report compliance, review and comment on reports

## All pages
/ — Public — Homepage: hero, how it works (3-role tabs), company preview strip, stats, pricing, CTA, footer
/companies — Public — Company directory: search bar, filter pills, card grid with real Supabase data
/companies/[id] — Public — Company profile: details, slots by dept, reviews, gallery, sticky apply sidebar
/auth/register — Auth — 3-step: role select + role-specific form + success. Writes to Supabase Auth + user_roles + profile table
/auth/login — Auth — Email + password + redirect to correct dashboard based on role
/dashboard/student — Protected (student) — Application status cards, quick actions, activity feed
/dashboard/student/reports — Protected (student) — Submit weekly report form, list past reports + supervisor feedback
/dashboard/company — Protected (company) — Applications inbox (accept/decline), slot management
/dashboard/supervisor — Protected (supervisor) — Student list with placement status and report compliance
/dashboard/supervisor/reports — Protected (supervisor) — Read student reports, leave written feedback

## Folder structure
saims/
├── app/
│   ├── auth/login/page.tsx
│   ├── auth/register/page.tsx
│   ├── companies/page.tsx
│   ├── companies/[id]/page.tsx
│   ├── dashboard/student/page.tsx
│   ├── dashboard/student/reports/page.tsx
│   ├── dashboard/company/page.tsx
│   ├── dashboard/supervisor/page.tsx
│   ├── dashboard/supervisor/reports/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/ui/   ← Button, Card, Badge, Input, Select, Modal, Spinner
├── lib/supabase.ts           ← browser client (use client components)
├── lib/supabase-server.ts    ← server client (Server Components, route handlers)
├── proxy.ts         ← route protection (Next.js 16)
├── CLAUDE.md
├── MEMO.md
└── .env.local

## Database schema (all tables have RLS enabled)
auth.users — Supabase Auth managed
public.user_roles — user_id UUID FK, role TEXT CHECK('student','company','supervisor')
public.students — user_id UUID FK, first_name, last_name, reg_number, university, department, level
public.companies — user_id UUID FK, name, industry, location, size, description, slots_available INT, is_subscribed BOOL, avg_rating NUMERIC
public.supervisors — user_id UUID FK, title, full_name, institution, department, staff_id
public.applications — student_id FK, company_id FK, status CHECK('pending','under_review','accepted','declined'), motivation TEXT, applied_at, updated_at. UNIQUE(student_id, company_id)
public.reports — student_id FK, company_id FK, supervisor_id FK, week_number INT, tasks_done TEXT, skills_developed TEXT, challenges TEXT, feedback TEXT, status CHECK('submitted','reviewed'). UNIQUE(student_id, week_number)
public.reviews — student_id FK, company_id FK, rating SMALLINT CHECK(1-5), comment TEXT. UNIQUE(student_id, company_id)

## Security rules — apply to every file
- RLS enabled on all 7 tables with policies already written
- Students: read/write own rows only
- Companies: read only applications/reports addressed to them
- Supervisors: read/write reports of assigned students only
- Validate all form inputs BEFORE inserting to Supabase
- No any TypeScript types. Always type parameters and return values.
- Never console.log user data, tokens, or passwords
- Use process.env.NEXT_PUBLIC_SUPABASE_URL! (non-null assertion) in TypeScript

## Design system
Background: #060B16 | Surface: #101A2E | Surface2: #172236
Blue: #3B82F6 | Green: #10B981 | Amber: #F59E0B | Red: #EF4444
Text: #EEF4FF | Muted: #8BA4C8 | Border: rgba(255,255,255,0.07)
Fonts: Syne (headings 700-800) + Plus Jakarta Sans (body) + DM Mono (labels/mono)
Cards: surface bg, 0.5px border, 12-16px radius, hover = blue border glow
Buttons: pill shape (rounded-full), blue fill primary, ghost secondary
Reference: Linear.app, Vercel dashboard, Stripe dark mode
Mobile-first: minimum 320px width on all pages

## Images
Office: https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop
Tech: https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop
Students: https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop
Company logos: use colored initials div — never placeholder.com

## Seed companies (real Bamenda organisations)
MTN Cameroon | Orange Cameroon | SEED (Cybersecurity) | TRAITZ Tech | NevTech | GeP ProTech Academy | Afriland First Bank | Civil Salt

## Development rules
1. Read MEMO.md first. Update MEMO.md after every task. No exceptions.
2. lib/supabase.ts = browser client, use client components only
3. lib/supabase-server.ts = server client, Server Components and route handlers only
4. All files: .tsx for React components, .ts for utilities. No .js or .jsx.
5. No any type. Type all parameters and return values.
6. Commit after every working sprint increment.
7. Database changes: write the SQL and ask developer to run in Supabase SQL Editor.
8. Handle null and error on every Supabase query.
9. Restart dev server every 2-3 hours to prevent memory buildup.
10. Always build empty states: no results, no applications, no students assigned.

## Sprint plan
[x] Setup sprint — Next.js 16 TypeScript, Supabase 7 tables + RLS, GitHub + Vercel, proxy.ts working
[ ] Sprint 1 — Auth: register (3-step role select + form + success) + login + 3 skeleton dashboards
[ ] Sprint 2 — Homepage (/), company directory (/companies), company profile (/companies/[id]), seed 6 companies
[ ] Sprint 3 — Student application flow: apply from profile, track status on student dashboard
[ ] Sprint 4 — Company dashboard: manage applications accept/decline, slot management
[ ] Sprint 5 — Reports: weekly submission, supervisor dashboard, review + feedback
[ ] Final — User evaluation 8 participants, screenshots for dissertation Chapter 3
