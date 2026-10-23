# BMU Course File Management System (CFMS)

A web-based Course File Management System designed for **BML Munjal University (BMU)**. This system streamlines course file preparation, consolidation, and academic review across faculty members, course coordinators, and academic administrators following the official **25-point course file template**.

---

## 🏛️ System Overview

The BMU Course File Management System provides three dedicated role workspaces:

1. **Academic Administrator**
   - Manage programs, courses, departments, and faculty rosters.
   - Configure academic years and semesters (*e.g., AY 2026-2027 Odd Semester*).
   - Assign Course Coordinators to specific course offerings.
   - Map multiple faculty members to course offerings with respective sections/batches.
   - Monitor university-wide course file completion status.

2. **Faculty Member**
   - Access assigned courses and sections.
   - Upload course documents following the official 25-section template:
     - **Sections 1–11**: Common documents managed by Coordinator (read-only for faculty).
     - **Sections 12–24**: Faculty-specific assessment, attendance, and feedback documents (**Mandatory**).
     - **Section 25**: Additional pedagogical material (**Optional**).
   - Multi-file upload support with simulated drag-and-drop.
   - Real-time section completion progress and inline coordinator correction feedback.

3. **Course Coordinator**
   - Manage common institutional and course documents for sections 1–11 (Course details, University/School Vision & Mission, PEOs/POs, Syllabus, Session plan, Student lists).
   - Review submissions from all faculty members teaching the subject.
   - Dual review view: **By Faculty** or **By Template Section (12–25)**.
   - Approve documents or request corrections with actionable comments.
   - **Course File Compilation & Preview**: Consolidate common documents and faculty submissions into the official 25-point course file dossier with section tags and export options (PDF and Word).

---

## 📋 Official 25-Point Course File Template

1. Course Details: Course Code, Course Title, Semester/Term/Module, Year
2. Vision and Mission of the University
3. Graduate Attributes of BMU Students
4. Vision and Mission of the School
5. PEOs, POs and PSOs of the Program
6. Course Description and Objectives
7. Course Outcomes and CO–PO Mapping
8. Course Syllabus, Teaching Hours, Readings, Learning Resources
9. Detailed Session-wise Plan
10. Weekly Timetable
11. Registered Students List
12. Details of Internal Assessments & CO Mapping *(Faculty)*
13. Mid-Semester Question Papers with Sample Solutions *(Faculty)*
14. Sample Evaluated Internal Submissions & Weak Student Identification *(Faculty)*
15. Reflections on Mid-Term Feedback & Interventions *(Faculty)*
16. Interventions for Slow Performers & Advanced Learners *(Faculty)*
17. End-Semester Question Papers with Sample Solutions *(Faculty)*
18. Details of Marks in All Components up to End Semester *(Faculty)*
19. Attendance Report *(Faculty)*
20. Final Record of Results, Including Grades *(Faculty)*
21. Analysis of Direct Feedback Received on Course Outcomes *(Faculty)*
22. CO Attainment Measurement Analysis *(Faculty)*
23. Feedback from Class Committee & Corrective Actions *(Faculty)*
24. Faculty Course Review & Innovative Pedagogies *(Faculty)*
25. Any Other Additional Information *(Optional)*

---

## 🛠️ Repository Structure

```
├── frontend/             # Complete 25-section BMU React frontend prototype
│   ├── src/
│   │   ├── components/   # Layout, Sidebar, Topbar, Modals, Shared Badges
│   │   ├── context/      # AuthContext with demo role switching
│   │   ├── data/         # Official 25-section template & mock data
│   │   └── pages/        # Admin, Faculty, Coordinator workspaces
│   ├── index.html
│   └── vite.config.js
├── backend/              # Node.js + Express + Prisma backend microservices
│   ├── prisma/           # Database schema & partial indexes
│   └── src/              # Auth, courses, submissions, and consolidation modules
├── database/             # Normalized relational SQL schema
│   └── schema.sql
├── client/               # Legacy / alternative frontend client
└── SETUP_INSTRUCTIONS.md
```

---

## 🚀 Getting Started

### 1. Running the BMU Frontend Application

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

#### 🔑 Demo Accounts (One-Click Sign-In):
- **Admin**: `admin@bmu.edu.in` / `admin123`
- **Faculty**: `priya.sharma@bmu.edu.in` / `faculty123`
- **Course Coordinator**: `neha.gupta@bmu.edu.in` / `coord123`

### 2. Running the Backend Server

```bash
cd backend
npm install
npm run dev
```

---

## 📄 License

MIT
