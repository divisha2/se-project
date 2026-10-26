# Course File Management System - Backend

Express + TypeScript + Prisma (Supabase PostgreSQL + Storage).

## Setup

```bash
npm install
cp .env.example .env          # fill in Supabase + JWT (+ optional LLM) values
npm run db:push               # creates tables + partial unique indexes
npx prisma generate
npm run db:seed               # base data, then submission parts + keywords
npm run dev                   # http://localhost:5000/api/health
```

Create a **private** Storage bucket named as `SUPABASE_STORAGE_BUCKET` in Supabase.
Seed login: `faculty1@bmu.example`, `course_coordinator1@bmu.example`, `admin1@bmu.example` / `BMU@12345`.

## Concepts

- In every `/:courseId` URL, `courseId` is a **CourseOffering id** (a course in a semester).
- **Item** = one Course File section for one course section (e.g. "14. Internal Assessment Question Papers", Section A).
- **Part** = a group of sections submitted together. **Complete submission** = all parts of a section submitted.
- Status shown to users: `PENDING`, `SUBMITTED`, `INVALID`, `LOCKED` (derived; see `utils/itemState.ts`).

## Submission flow

1. `GET  /course-file/:courseId/workspace` - my sections -> parts -> items
2. `POST /submissions/items/:itemId` - multipart `file` or field `text`; every call is a new version
3. background check -> `VALID` / `NEEDS_REVIEW` / `INVALID` (poll the workspace)
4. `DELETE /submissions/items/:itemId`, `POST /submissions/items/:itemId/versions/:n/restore`
5. `POST /course-file/:courseId/sections/:sectionId/parts/:partId/submit`
6. `POST /course-file/:courseId/sections/:sectionId/complete`
7. Coordinator: `GET /course-file/:courseId/completion`, `PUT /submissions/course/:courseId/deadline`,
   `POST /submissions/items/:itemId/reopen`, `POST /submissions/:id/review`,
   `POST /consolidation/course/:courseId/run`, review at `/consolidation/...`, `POST /generation/course/:courseId`
