# Course File Management System - Backend

Express + TypeScript + Prisma (Supabase PostgreSQL). Structure follows the SRS.

## Setup

```bash
npm install
cp .env.example .env        # fill in Supabase + JWT values
# 1. write prisma/schema.prisma (add generator + datasource blocks)
# 2. create tables:  npm run prisma:push   (or prisma:migrate)
npm run prisma:generate
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

## Structure

```
prisma/schema.prisma        your schema (empty)
src/
  server.ts / app.ts        entry + express setup
  config/                   env, prisma client, supabase storage client
  middleware/               auth (JWT), role guard, upload (multer), validate, errors
  utils/                    ApiError, asyncHandler
  constants/                roles, submission statuses, file types
  jobs/                     background AI queue (PR-05)
  modules/
    auth/                   login, me
    users/                  FR-ADM-01..04
    courses/                courses, sections, faculty assignment, coordinator (FR-ADM-05..09)
    course-file/            predefined sections, mandatory/optional (FR-FAC-03, 11)
    submissions/            upload, validate, versions, locking (FR-FAC-*, FR-CC-01..08)
    consolidation/          AI processing, review/edit/accept (FR-AI-*, FR-CC-09..16)
    generation/             final Course File output (FR-CC-17..20)
```

Each module has `*.routes.ts`, `*.controller.ts`, `*.service.ts`. Handlers currently return
`501 Not Implemented`; the FR IDs from the SRS are in comments so you can fill them in
once your Prisma models exist.

## Suggested build order (from SRS 2.5)

1. Auth, users, courses, sections, assignments
2. Course File sections + faculty uploads (storage, versions, locking)
3. Completeness tracking + submission validation
4. AI extraction / consolidation (run via `src/jobs`)
5. Coordinator review + final Course File generation
