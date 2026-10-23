# BML Munjal University (BMU) - Course File Management System
## Phase 1: Database Design & Architecture Specification

---

## 1. Executive Summary & Architecture Overview

The **BMU Course File Management System** is designed to streamline academic compliance, NAAC/NBA accreditation readiness, and syllabus delivery tracking across all schools at BML Munjal University (SOET, SOM, SOL, SOLS).

The Course File is a comprehensive pedagogical portfolio consisting of **25 mandatory sections** that document the end-to-end lifecycle of a course in a semester—from University Vision/Mission and CO-PO mapping to session plans, question papers, evaluated answer scripts, remedial interventions, attendance, result analysis, and faculty course reviews.

### Key Architectural Highlights
- **Single Account Dual-Role (Faculty & Course Coordinator):** The Course Coordinator is fundamentally a faculty member. By decoupling users from roles via a Many-to-Many junction table (`user_roles`) and assigning the coordinator role at the `course_offerings` and `course_files` level, a professor can upload their own section documents as an instructor and simultaneously review, lock, and approve the entire Course File using the exact same login account.
- **Strict Template Fidelity:** The official BMU 25-section sequence is preserved verbatim with an immutable numerical index (`1` to `25`) and cannot be reordered, omitted, or duplicated.
- **Section-Level Locking & Missing-Submission Tracking:** Each section can be assigned specific deadlines, status flags, and cryptographic locks to prevent unauthorized modifications once reviewed.
- **Full Document Version Control:** Every revised submission creates an incrementing version record (`v1`, `v2`, `v3`) while preserving complete audit logs of who uploaded what and when.
- **Forward Compatibility for AI Processing & Consolidated Content:** Built-in tables for AI OCR/text extraction, CO-PO alignment verification, and automated consolidation (linking compiled master documents back to their original source files).

---

## 2. Table Catalog & Relationship Architecture

The database comprises **19 normalized tables** and **4 convenience views** grouped into 6 functional modules:

```
+---------------------------------------------------------------------------------------------------+
|                                       BMU DATABASE MODULES                                        |
+---------------------------------------------------------------------------------------------------+
|  1. Users & RBAC      | roles, users, user_roles                                                  |
|  2. Academic Structure| academic_years, semesters, schools, programs, courses,                   |
|                       | course_offerings, sections, section_faculty_assignments                   |
|  3. Template & Schema | course_file_templates, template_sections (25 Official Sections)          |
|  4. Course File Items | course_files, course_file_items (Deadlines, Locks, Status)                |
|  5. Submissions & Logs| document_submissions, submission_reviews, audit_logs,                     |
|                       | missing_submission_alerts                                                 |
|  6. AI & Consolidation| ai_processing_records, consolidated_contents,                             |
|                       | consolidated_content_sources                                              |
+---------------------------------------------------------------------------------------------------+
```

### Module Breakdown

#### Module 1: User Management & RBAC
1. **`roles`**: Defines standard privilege levels: `ADMIN`, `FACULTY`, and `COURSE_COORDINATOR`.
2. **`users`**: Master registry of faculty and administrators containing BMU employee ID, name, official email, department, and designation.
3. **`user_roles`**: Many-to-Many mapping table. This allows a faculty member to possess both `FACULTY` and `COURSE_COORDINATOR` roles simultaneously without creating duplicate user accounts.

#### Module 2: Academic Hierarchy
4. **`academic_years`**: Master academic calendar years (e.g., `2025-2026`).
5. **`semesters`**: Semesters linked to academic years (`ODD`, `EVEN`, `SUMMER`).
6. **`schools`**: BMU constituent schools (e.g., `SOET` - School of Engineering and Technology, `SOM` - School of Management, `SOL` - School of Law).
7. **`programs`**: Degree programs under each school (e.g., `BTECH_CSE`, `MBA`), capturing Program Educational Objectives (`PEOs`) and Program Outcomes / Program Specific Outcomes (`POs_PSOs`).
8. **`courses`**: Course catalog (e.g., `CSE2001 - Data Structures and Algorithms`), credits, course objectives, and standard syllabus text.
9. **`course_offerings`**: Links a course to a specific academic year and semester, and explicitly assigns the **Course Coordinator** (`coordinator_id -> users.user_id`).
10. **`sections`**: Course sections (e.g., `Section A`, `Section B`) under an offering.
11. **`section_faculty_assignments`**: Maps which faculty member teaches which section (`PRIMARY_INSTRUCTOR`, `CO_INSTRUCTOR`, `LAB_INSTRUCTOR`).

#### Module 3: Master Template & The 25 Sections
12. **`course_file_templates`**: Master template metadata (e.g., `BMU_OFFICIAL_TEMPLATE_V1`).
13. **`template_sections`**: Stores the **25 official sections** in strict order (1 to 25). Each section has a designated scope:
    - `COURSE_LEVEL`: Uploaded or compiled once for the entire course by the Course Coordinator (e.g., Syllabus, Vision/Mission, CO Attainment).
    - `SECTION_LEVEL`: Uploaded separately for each section by the respective section faculty (e.g., Attendance Report, Registered Students List, Sample Evaluated Scripts).
    - `HYBRID`: May contain course-wide components and section-specific details (e.g., Weekly Timetable, Session Plan).

#### Module 4: Course File Instances & Operational Items
14. **`course_files`**: The operational Course File instance created for a course offering, tracking overall completion percentage and coordinator review status.
15. **`course_file_items`**: The individual checklist items corresponding to template sections. Supports:
    - `submission_deadline`: Explicit cutoff timestamp.
    - `status`: `PENDING`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REVISION_REQUESTED`.
    - `is_locked`, `locked_by`, `locked_at`, `lock_reason`: Coordinator lock mechanism preventing edits once approved.

#### Module 5: Submissions, Version Control & Reviews
16. **`document_submissions`**: Stores physical file references (file path, MIME type, size, SHA-256 hash). When a faculty member uploads a revision, `version_number` increments (`v1`, `v2`, `v3`) and previous versions remain accessible for audit purposes.
17. **`submission_reviews`**: Detailed Coordinator/Admin review remarks (`APPROVED`, `REVISION_REQUESTED`, `REJECTED`) with timestamps.
18. **`audit_logs`**: System-wide ledger recording critical operational events (locking, unlocking, deadline changes, status overrides).
19. **`missing_submission_alerts`**: Tracks overdue checklist items for automated email notifications and coordinator dashboards.

#### Module 6: Future AI Processing & Consolidated Content
20. **`ai_processing_records`**: Pre-configured for downstream AI services:
    - Automated text extraction (OCR).
    - Syllabus coverage validation.
    - CO-PO alignment verification against bloom's taxonomy keywords.
    - Automated summary generation.
21. **`consolidated_contents`**: Stores compiled course portfolios (e.g., Multi-Section Consolidated Attendance, Combined Result Analysis, or the Full Course File Master PDF).
22. **`consolidated_content_sources`**: **Traceability Link Table**. Maps every consolidated document back to the exact original file submission IDs (`submission_id`) and the faculty members who provided them.

---

## 3. Official BMU Course File Template (The 25 Sections)

The database schema pre-populates these 25 sections in exact sequential order:

| # | Official Section Title | Default Scope | Mandatory |
|---|------------------------|---------------|-----------|
| **1** | Course Details: Course-Code; Course Title; Semester/Term/Module; Year | COURSE_LEVEL | Yes |
| **2** | Vision, Mission of the University | COURSE_LEVEL | Yes |
| **3** | Graduate Attributes of the BMU Students | COURSE_LEVEL | Yes |
| **4** | Vision, Mission of the School | COURSE_LEVEL | Yes |
| **5** | PEOs and POs & PSOs of the Program | COURSE_LEVEL | Yes |
| **6** | Course Description and its objectives | COURSE_LEVEL | Yes |
| **7** | Course Outcomes and CO-PO Mapping | COURSE_LEVEL | Yes |
| **8** | Course Syllabus | COURSE_LEVEL | Yes |
| **9** | Detailed Session wise Plan | HYBRID | Yes |
| **10** | Weekly Timetable | HYBRID | Yes |
| **11** | Registered Students List | SECTION_LEVEL | Yes |
| **12** | Details of Internal Assessments; weightages, due dates, mapping to CO | COURSE_LEVEL | Yes |
| **13** | Mid Semester Question papers with sample solutions | COURSE_LEVEL | Yes |
| **14** | Sample Evaluated Internal Submissions and Identification of weak students | SECTION_LEVEL | Yes |
| **15** | Reflections from Mid-term semester feedback, interventions to enhance learning and improve teaching/learning strategies | HYBRID | Yes |
| **16** | Interventions for slow performers and advanced learners (retest, resubmissions, etc.) | SECTION_LEVEL | Yes |
| **17** | End Semester Question papers with sample solutions | COURSE_LEVEL | Yes |
| **18** | Detail of Marks in all components up to End Semester | SECTION_LEVEL | Yes |
| **19** | Attendance Report | SECTION_LEVEL | Yes |
| **20** | Final record of Results (including grades) | COURSE_LEVEL | Yes |
| **21** | Analyzing Direct Feedback received on Course Outcomes | COURSE_LEVEL | Yes |
| **22** | CO Attainment Measurement Analysis | COURSE_LEVEL | Yes |
| **23** | Feedback (class committee or otherwise) and corrective actions | HYBRID | Yes |
| **24** | Faculty Course Review (innovative pedagogies, technology, experiential learning, alignment with university mission, feedback, CO attainment for next run) | COURSE_LEVEL | Yes |
| **25** | Any other additional information. | COURSE_LEVEL | Optional |

---

## 4. Step-by-Step Instructions: Executing in MySQL Workbench

### Connection Details
- **Connection Name:** `SoftwareEng`
- **Host:** `127.0.0.1`
- **Port:** `3306`
- **Username:** `root`
- **Database:** `course_file_db`

### Execution Steps
1. **Launch MySQL Workbench**:
   - Double-click on the `SoftwareEng` connection tile on the home screen.
   - Enter your `root` password when prompted.
2. **Open the SQL Script**:
   - In MySQL Workbench, click **File** -> **Open SQL Script...** (or press `Ctrl + O`).
   - Navigate to:
     `C:\Users\bHAVYA\.gemini\antigravity-ide\scratch\bmu-course-file-system\database\schema.sql`
     *(or `C:\Users\bHAVYA\.gemini\antigravity-ide\scratch\database\schema.sql`)*.
3. **Execute the Script**:
   - Click the **Yellow Lightning Bolt icon** (`Execute the entire script`) on the toolbar (or press `Ctrl + Shift + Enter`).
   - Observe the **Action Output** pane at the bottom: all statements will display green checkmarks.
4. **Refresh Schema Navigator**:
   - In the left sidebar under the **Schemas** tab, right-click and click **Refresh All**.
   - You will see `course_file_db` with all 19 tables and 4 views.

---

## 5. Verification Queries & Expected Results

Run these queries in a new query tab (`Ctrl + T`) in MySQL Workbench to confirm the database integrity:

### Verification Query 1: Confirm Exact 25 Sections Count
```sql
USE course_file_db;

SELECT
    COUNT(*) AS total_seeded_sections,
    CASE 
        WHEN COUNT(*) = 25 THEN 'SUCCESS: EXACTLY 25 SECTIONS PRESENT'
        ELSE 'ERROR: INCORRECT COUNT'
    END AS verification_status
FROM template_sections ts
INNER JOIN course_file_templates t ON ts.template_id = t.template_id
WHERE t.template_code = 'BMU_OFFICIAL_TEMPLATE_V1';
```
**Expected Result:** `total_seeded_sections: 25`, `verification_status: SUCCESS: EXACTLY 25 SECTIONS PRESENT`.

---

### Verification Query 2: Inspect All 25 Sections in Exact Sequential Order
```sql
USE course_file_db;

SELECT
    section_number,
    section_title,
    scope_type,
    is_mandatory
FROM vw_template_25_sections;
```
**Expected Result:** A clean list from 1 to 25 matching the BMU specification.

---

### Verification Query 3: Verify Dual-Role Architecture (Faculty & Coordinator)
```sql
USE course_file_db;

-- Shows roles assigned to users
SELECT
    u.employee_id,
    u.full_name,
    u.email,
    GROUP_CONCAT(r.role_code ORDER BY r.role_code SEPARATOR ', ') AS assigned_roles
FROM users u
INNER JOIN user_roles ur ON u.user_id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.role_id
GROUP BY u.user_id, u.employee_id, u.full_name, u.email;
```

---

### Verification Query 4: Check Missing / Overdue Submissions
```sql
USE course_file_db;

SELECT * FROM vw_missing_submissions;
```

---

### Verification Query 5: Verify Consolidated Document Traceability
```sql
USE course_file_db;

SELECT * FROM vw_consolidated_source_traceability;
```

---

## 6. Safety & Re-Run Guarantee

The script has been crafted with industrial database safety standards:
- **`CREATE DATABASE IF NOT EXISTS course_file_db`**: Never drops your database or erases existing schemas.
- **`CREATE TABLE IF NOT EXISTS`**: Preserves existing tables without data destruction.
- **`INSERT ... ON DUPLICATE KEY UPDATE`**: The template sections use deterministic composite unique keys (`template_id`, `section_number`). You can execute the script multiple times without duplicate key errors or redundant rows.

---

## 7. Recommended Antigravity IDE Workspace Setting

To keep your workspace organized, set your Antigravity IDE workspace folder to:
```
C:\Users\bHAVYA\.gemini\antigravity-ide\scratch\bmu-course-file-system
```
This contains the `database/` directory with `schema.sql` and `README.md`.
