-- ============================================================================
-- BML MUNJAL UNIVERSITY (BMU) - COURSE FILE MANAGEMENT SYSTEM
-- Phase 1: Database Design & Schema Definition
-- Target DBMS : MySQL 8.0+
-- Storage Engine : InnoDB
-- Character Set  : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DATABASE CREATION (Safe Check: Do not drop if exists, create if missing)
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `course_file_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `course_file_db`;

-- ----------------------------------------------------------------------------
-- 2. USER MANAGEMENT & ROLE-BASED ACCESS CONTROL (RBAC)
-- ----------------------------------------------------------------------------

-- Table: roles
-- Holds system roles: ADMIN, FACULTY, COURSE_COORDINATOR.
CREATE TABLE IF NOT EXISTS `roles` (
    `role_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `role_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique identifier code, e.g., ADMIN, FACULTY, COURSE_COORDINATOR',
    `role_name` VARCHAR(100) NOT NULL COMMENT 'Display name of the role',
    `description` VARCHAR(255) NULL COMMENT 'Brief explanation of permissions',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users
-- Holds all user accounts. A faculty member can also be a Course Coordinator.
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'BMU Employee ID, e.g., BMU-FAC-1024',
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(25) NULL,
    `department` VARCHAR(100) NOT NULL COMMENT 'Department or School name',
    `designation` VARCHAR(100) NULL COMMENT 'Assistant Professor, Associate Professor, Professor, etc.',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_department` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_roles (Many-to-Many)
-- Allows a single faculty account to have both FACULTY and COURSE_COORDINATOR roles.
CREATE TABLE IF NOT EXISTS `user_roles` (
    `user_id` INT UNSIGNED NOT NULL,
    `role_id` INT UNSIGNED NOT NULL,
    `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`)
        REFERENCES `roles` (`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 3. ACADEMIC STRUCTURE (Years, Semesters, Schools, Programs, Courses)
-- ----------------------------------------------------------------------------

-- Table: academic_years
CREATE TABLE IF NOT EXISTS `academic_years` (
    `academic_year_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `year_name` VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g., 2025-2026',
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: semesters
CREATE TABLE IF NOT EXISTS `semesters` (
    `semester_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `academic_year_id` INT UNSIGNED NOT NULL,
    `semester_type` ENUM('ODD', 'EVEN', 'SUMMER') NOT NULL,
    `semester_name` VARCHAR(50) NOT NULL COMMENT 'e.g., Fall 2025 (Odd Semester)',
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_current` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_semesters_academic_year` FOREIGN KEY (`academic_year_id`)
        REFERENCES `academic_years` (`academic_year_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY `uk_academic_year_sem` (`academic_year_id`, `semester_type`, `semester_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: schools (BMU Schools: SOET, SOM, SOL, etc.)
CREATE TABLE IF NOT EXISTS `schools` (
    `school_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `school_code` VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g., SOET, SOM, SOL',
    `school_name` VARCHAR(150) NOT NULL COMMENT 'e.g., School of Engineering and Technology',
    `vision` TEXT NULL COMMENT 'School Vision for Section 4',
    `mission` TEXT NULL COMMENT 'School Mission for Section 4',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: programs (e.g., B.Tech CSE, MBA)
CREATE TABLE IF NOT EXISTS `programs` (
    `program_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `school_id` INT UNSIGNED NOT NULL,
    `program_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g., BTECH_CSE',
    `program_name` VARCHAR(150) NOT NULL,
    `degree_level` ENUM('UG', 'PG', 'DOCTORAL') NOT NULL DEFAULT 'UG',
    `peos` TEXT NULL COMMENT 'Program Educational Objectives (Section 5)',
    `pos_psos` TEXT NULL COMMENT 'Program Outcomes & Program Specific Outcomes (Section 5)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_programs_school` FOREIGN KEY (`school_id`)
        REFERENCES `schools` (`school_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: courses
CREATE TABLE IF NOT EXISTS `courses` (
    `course_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `program_id` INT UNSIGNED NOT NULL,
    `course_code` VARCHAR(30) NOT NULL UNIQUE COMMENT 'e.g., CSE2001',
    `course_title` VARCHAR(200) NOT NULL COMMENT 'e.g., Data Structures and Algorithms',
    `credits` DECIMAL(3, 1) NOT NULL DEFAULT 3.0,
    `course_description` TEXT NULL COMMENT 'Section 6 Course Description',
    `course_objectives` TEXT NULL COMMENT 'Section 6 Course Objectives',
    `syllabus_text` LONGTEXT NULL COMMENT 'Section 8 Course Syllabus',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_courses_program` FOREIGN KEY (`program_id`)
        REFERENCES `programs` (`program_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_courses_code` (`course_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: course_offerings
-- A course offered in a particular semester, assigned to a Course Coordinator (Faculty).
CREATE TABLE IF NOT EXISTS `course_offerings` (
    `course_offering_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `course_id` INT UNSIGNED NOT NULL,
    `semester_id` INT UNSIGNED NOT NULL,
    `coordinator_id` INT UNSIGNED NOT NULL COMMENT 'Course Coordinator (must be a registered faculty user)',
    `status` ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_offering_course` FOREIGN KEY (`course_id`)
        REFERENCES `courses` (`course_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_offering_semester` FOREIGN KEY (`semester_id`)
        REFERENCES `semesters` (`semester_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_offering_coordinator` FOREIGN KEY (`coordinator_id`)
        REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY `uk_course_offering` (`course_id`, `semester_id`),
    INDEX `idx_offering_coordinator` (`coordinator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: sections
-- Sections for a course offering (e.g., Section A, Section B).
CREATE TABLE IF NOT EXISTS `sections` (
    `section_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `course_offering_id` INT UNSIGNED NOT NULL,
    `section_name` VARCHAR(50) NOT NULL COMMENT 'e.g., Section A, Section B',
    `capacity` INT UNSIGNED NOT NULL DEFAULT 60,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sections_offering` FOREIGN KEY (`course_offering_id`)
        REFERENCES `course_offerings` (`course_offering_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uk_offering_section_name` (`course_offering_id`, `section_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: section_faculty_assignments
-- Assigns faculty to sections. Course Coordinator can also be an instructor for a section.
CREATE TABLE IF NOT EXISTS `section_faculty_assignments` (
    `assignment_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `section_id` INT UNSIGNED NOT NULL,
    `faculty_id` INT UNSIGNED NOT NULL COMMENT 'References users table',
    `assignment_role` ENUM('PRIMARY_INSTRUCTOR', 'CO_INSTRUCTOR', 'LAB_INSTRUCTOR') NOT NULL DEFAULT 'PRIMARY_INSTRUCTOR',
    `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sfa_section` FOREIGN KEY (`section_id`)
        REFERENCES `sections` (`section_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sfa_faculty` FOREIGN KEY (`faculty_id`)
        REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY `uk_section_faculty` (`section_id`, `faculty_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 4. REUSABLE COURSE FILE TEMPLATE & OFFICIAL 25 SECTIONS
-- ----------------------------------------------------------------------------

-- Table: course_file_templates
-- Master template definition (allows future versions if BMU updates requirements).
CREATE TABLE IF NOT EXISTS `course_file_templates` (
    `template_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `template_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g., BMU_OFFICIAL_TEMPLATE_V1',
    `template_name` VARCHAR(150) NOT NULL COMMENT 'BMU Official Course File Template',
    `version` VARCHAR(20) NOT NULL DEFAULT '1.0',
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: template_sections
-- Holds the master 25 sections in exact sequential order.
CREATE TABLE IF NOT EXISTS `template_sections` (
    `section_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `template_id` INT UNSIGNED NOT NULL,
    `section_number` INT UNSIGNED NOT NULL COMMENT '1 to 25 strictly',
    `section_title` VARCHAR(500) NOT NULL COMMENT 'Official section title verbatim',
    `description` TEXT NULL COMMENT 'Guidance notes for faculty',
    `scope_type` ENUM('COURSE_LEVEL', 'SECTION_LEVEL', 'HYBRID') NOT NULL DEFAULT 'COURSE_LEVEL'
        COMMENT 'COURSE_LEVEL: uploaded by Coordinator for whole course; SECTION_LEVEL: uploaded per section by instructor; HYBRID: both',
    `is_mandatory` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ts_template` FOREIGN KEY (`template_id`)
        REFERENCES `course_file_templates` (`template_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uk_template_section_number` (`template_id`, `section_number`),
    INDEX `idx_section_number` (`section_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 5. COURSE FILE INSTANCES, ITEMS, DEADLINES & SECTION LOCKING
-- ----------------------------------------------------------------------------

-- Table: course_files
-- The specific course file container for a course offering.
CREATE TABLE IF NOT EXISTS `course_files` (
    `course_file_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `course_offering_id` INT UNSIGNED NOT NULL UNIQUE,
    `template_id` INT UNSIGNED NOT NULL,
    `coordinator_id` INT UNSIGNED NOT NULL COMMENT 'Faculty responsible for reviewing & approving the course file',
    `status` ENUM('DRAFT', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'REVISION_REQUESTED', 'ARCHIVED')
        NOT NULL DEFAULT 'IN_PROGRESS',
    `overall_completion_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cf_offering` FOREIGN KEY (`course_offering_id`)
        REFERENCES `course_offerings` (`course_offering_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_cf_template` FOREIGN KEY (`template_id`)
        REFERENCES `course_file_templates` (`template_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_cf_coordinator` FOREIGN KEY (`coordinator_id`)
        REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_cf_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: course_file_items
-- Represents each item in a course file. Can be course-wide or section-specific.
-- Supports deadlines, missing-submission tracking, status, and section locking.
CREATE TABLE IF NOT EXISTS `course_file_items` (
    `item_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `course_file_id` INT UNSIGNED NOT NULL,
    `template_section_id` INT UNSIGNED NOT NULL,
    `section_id` INT UNSIGNED NULL COMMENT 'NULL for course-level items; specified for section-level items',
    `assigned_faculty_id` INT UNSIGNED NULL COMMENT 'Faculty responsible for this specific item',
    `submission_deadline` DATETIME NULL COMMENT 'Deadline for submission; used for missing submission tracking',
    `status` ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED')
        NOT NULL DEFAULT 'PENDING',
    `is_locked` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'When TRUE, no new submissions or edits allowed without unlock',
    `locked_by` INT UNSIGNED NULL COMMENT 'Coordinator or Admin who locked this section',
    `locked_at` DATETIME NULL,
    `lock_reason` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cfi_course_file` FOREIGN KEY (`course_file_id`)
        REFERENCES `course_files` (`course_file_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cfi_template_section` FOREIGN KEY (`template_section_id`)
        REFERENCES `template_sections` (`section_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_cfi_section` FOREIGN KEY (`section_id`)
        REFERENCES `sections` (`section_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cfi_assigned_faculty` FOREIGN KEY (`assigned_faculty_id`)
        REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_cfi_locked_by` FOREIGN KEY (`locked_by`)
        REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY `uk_file_item_section` (`course_file_id`, `template_section_id`, `section_id`),
    INDEX `idx_cfi_status` (`status`),
    INDEX `idx_cfi_deadline` (`submission_deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 6. DOCUMENT SUBMISSIONS, VERSIONING & REVIEWS
-- ----------------------------------------------------------------------------

-- Table: document_submissions
-- Stores each uploaded version of a document. Supports full audit history and versioning.
CREATE TABLE IF NOT EXISTS `document_submissions` (
    `submission_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `item_id` INT UNSIGNED NOT NULL,
    `version_number` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Incrementing version: 1, 2, 3...',
    `file_name` VARCHAR(255) NOT NULL COMMENT 'Original file name uploaded by faculty',
    `storage_path` VARCHAR(500) NOT NULL COMMENT 'Storage file path or cloud URI',
    `file_size_bytes` BIGINT UNSIGNED NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL COMMENT 'e.g., application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    `checksum_sha256` CHAR(64) NULL COMMENT 'Integrity hash',
    `uploaded_by` INT UNSIGNED NOT NULL COMMENT 'Faculty user who uploaded this document',
    `submission_notes` TEXT NULL COMMENT 'Faculty comments regarding this version',
    `is_current_version` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'TRUE for the latest active version',
    `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ds_item` FOREIGN KEY (`item_id`)
        REFERENCES `course_file_items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ds_uploaded_by` FOREIGN KEY (`uploaded_by`)
        REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY `uk_item_version` (`item_id`, `version_number`),
    INDEX `idx_ds_item_current` (`item_id`, `is_current_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: submission_reviews
-- Stores review feedback, approval, or revision requests by the Course Coordinator or Admin.
CREATE TABLE IF NOT EXISTS `submission_reviews` (
    `review_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `submission_id` INT UNSIGNED NOT NULL,
    `reviewed_by` INT UNSIGNED NOT NULL COMMENT 'Course Coordinator or Admin',
    `review_status` ENUM('APPROVED', 'REVISION_REQUESTED', 'REJECTED') NOT NULL,
    `review_comments` TEXT NOT NULL COMMENT 'Detailed feedback or required changes',
    `reviewed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sr_submission` FOREIGN KEY (`submission_id`)
        REFERENCES `document_submissions` (`submission_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sr_reviewed_by` FOREIGN KEY (`reviewed_by`)
        REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_sr_status` (`review_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 7. AUDIT LOGS & MISSING SUBMISSION ALERTS
-- ----------------------------------------------------------------------------

-- Table: audit_logs
-- Immutable event ledger for critical operations (locking, approvals, status updates).
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `log_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL COMMENT 'User who performed the action, or NULL if system',
    `action_type` VARCHAR(50) NOT NULL COMMENT 'SECTION_LOCKED, SECTION_UNLOCKED, SUBMISSION_UPLOADED, STATUS_CHANGED, etc.',
    `entity_name` VARCHAR(50) NOT NULL COMMENT 'Table affected, e.g., course_file_items',
    `entity_id` INT UNSIGNED NOT NULL COMMENT 'Primary key of the affected record',
    `details` JSON NULL COMMENT 'Structured details (old_value, new_value, ip_address, etc.)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_al_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_al_action` (`action_type`),
    INDEX `idx_al_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: missing_submission_alerts
-- Tracks overdue or missing items to assist Coordinator follow-ups and notifications.
CREATE TABLE IF NOT EXISTS `missing_submission_alerts` (
    `alert_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `item_id` INT UNSIGNED NOT NULL,
    `faculty_id` INT UNSIGNED NOT NULL,
    `alert_type` ENUM('DEADLINE_APPROACHING', 'OVERDUE', 'ESCALATED') NOT NULL DEFAULT 'OVERDUE',
    `alert_sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_resolved` BOOLEAN NOT NULL DEFAULT FALSE,
    `resolved_at` DATETIME NULL,
    CONSTRAINT `fk_msa_item` FOREIGN KEY (`item_id`)
        REFERENCES `course_file_items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_msa_faculty` FOREIGN KEY (`faculty_id`)
        REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_msa_resolved` (`is_resolved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 8. FUTURE AI PROCESSING & CONSOLIDATED CONTENT (With Traceability Links)
-- ----------------------------------------------------------------------------

-- Table: ai_processing_records
-- Records AI extractions, CO-PO mapping validations, syllabus alignment, quality audits.
CREATE TABLE IF NOT EXISTS `ai_processing_records` (
    `ai_record_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `submission_id` INT UNSIGNED NOT NULL,
    `task_type` ENUM('TEXT_EXTRACTION', 'SYLLABUS_ALIGNMENT_CHECK', 'CO_PO_VALIDATION', 'QUALITY_AUDIT', 'SUMMARY_GENERATION') NOT NULL,
    `processing_status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `extracted_text` LONGTEXT NULL COMMENT 'OCR/Parsed text from document',
    `ai_summary` TEXT NULL COMMENT 'AI generated executive summary',
    `confidence_score` DECIMAL(5, 2) NULL COMMENT '0.00 to 100.00 compliance/confidence percentage',
    `findings_json` JSON NULL COMMENT 'Structured validation issues, suggestions, or tags',
    `model_name` VARCHAR(100) NULL COMMENT 'AI model identifier, e.g., gemini-1.5-pro',
    `prompt_tokens` INT UNSIGNED NULL,
    `completion_tokens` INT UNSIGNED NULL,
    `error_message` TEXT NULL,
    `processed_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_aipr_submission` FOREIGN KEY (`submission_id`)
        REFERENCES `document_submissions` (`submission_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_aipr_status` (`processing_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: consolidated_contents
-- Master consolidated outputs (e.g., Compiled Course File, Cross-Section Attendance, CO Attainment).
CREATE TABLE IF NOT EXISTS `consolidated_contents` (
    `consolidated_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `course_file_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `consolidation_type` ENUM(
        'FULL_COURSE_FILE_ARCHIVE',
        'CONSOLIDATED_ATTENDANCE',
        'CONSOLIDATED_MARKS',
        'CONSOLIDATED_CO_ATTAINMENT',
        'AI_SYNTHESIZED_REVIEW'
    ) NOT NULL,
    `storage_path` VARCHAR(500) NOT NULL COMMENT 'Path to compiled PDF/ZIP/Report',
    `file_size_bytes` BIGINT UNSIGNED NULL,
    `is_ai_generated` BOOLEAN NOT NULL DEFAULT FALSE,
    `generated_by` INT UNSIGNED NULL COMMENT 'User who triggered consolidation or NULL if automated',
    `summary_notes` TEXT NULL,
    `generated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cc_course_file` FOREIGN KEY (`course_file_id`)
        REFERENCES `course_files` (`course_file_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cc_generated_by` FOREIGN KEY (`generated_by`)
        REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_cc_type` (`consolidation_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: consolidated_content_sources
-- Links consolidated content back to the original source submissions (traceability).
CREATE TABLE IF NOT EXISTS `consolidated_content_sources` (
    `source_link_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `consolidated_id` INT UNSIGNED NOT NULL,
    `submission_id` INT UNSIGNED NOT NULL,
    `source_role` VARCHAR(100) NULL COMMENT 'Contribution role, e.g., Section A Attendance Sheet, Mid-Sem QP',
    `linked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ccs_consolidated` FOREIGN KEY (`consolidated_id`)
        REFERENCES `consolidated_contents` (`consolidated_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ccs_submission` FOREIGN KEY (`submission_id`)
        REFERENCES `document_submissions` (`submission_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY `uk_consolidated_submission` (`consolidated_id`, `submission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 9. SEED DATA: OFFICIAL 25 SECTIONS & DEFAULT TEMPLATE (SAFE TO RE-RUN)
-- ----------------------------------------------------------------------------

-- Seed System Roles
INSERT INTO `roles` (`role_code`, `role_name`, `description`)
VALUES
    ('ADMIN', 'Administrator', 'Full system access and configurations'),
    ('FACULTY', 'Faculty Member', 'Can upload teaching materials, session plans, attendance and assessments'),
    ('COURSE_COORDINATOR', 'Course Coordinator', 'Faculty with coordinator duties: review, lock sections, approve Course Files')
ON DUPLICATE KEY UPDATE
    `role_name` = VALUES(`role_name`),
    `description` = VALUES(`description`);

-- Seed Official Course File Template
INSERT INTO `course_file_templates` (`template_code`, `template_name`, `version`, `description`, `is_active`)
VALUES
    ('BMU_OFFICIAL_TEMPLATE_V1', 'BMU Official Course File Template (25 Sections)', '1.0', 'Mandatory 25-section Course File specification for BML Munjal University programs.', TRUE)
ON DUPLICATE KEY UPDATE
    `template_name` = VALUES(`template_name`),
    `description` = VALUES(`description`),
    `is_active` = VALUES(`is_active`);

-- Seed the EXACT 25 Sections in Exact Order
-- Uses ON DUPLICATE KEY UPDATE to guarantee safe re-run without duplicate entries
INSERT INTO `template_sections`
    (`template_id`, `section_number`, `section_title`, `description`, `scope_type`, `is_mandatory`)
VALUES
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        1,
        'Course Details: Course-Code; Course Title; Semester/Term/Module; Year',
        'Official course metadata including course code, course title, semester/term/module, and academic year.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        2,
        'Vision, Mission of the University',
        'BML Munjal University official Vision and Mission statements.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        3,
        'Graduate Attributes of the BMU Students',
        'Defined graduate attributes expected of all graduating BMU students.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        4,
        'Vision, Mission of the School',
        'Vision and Mission statements of the respective BMU School (e.g., SOET, SOM, SOL).',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        5,
        'PEOs and POs & PSOs of the Program',
        'Program Educational Objectives (PEOs), Program Outcomes (POs), and Program Specific Outcomes (PSOs).',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        6,
        'Course Description and its objectives',
        'Comprehensive narrative of the course scope and targeted learning objectives.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        7,
        'Course Outcomes and CO-PO Mapping',
        'List of Course Outcomes (COs) and their detailed mapping matrix with Program Outcomes (POs and PSOs).',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        8,
        'Course Syllabus',
        'Official approved syllabus document with unit/module breakdowns and references.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        9,
        'Detailed Session wise Plan',
        'Lecture-by-lecture or session-wise teaching plan, reading materials, and pedagogy.',
        'HYBRID',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        10,
        'Weekly Timetable',
        'Timetable showing assigned slots, rooms, and faculty schedules across sections.',
        'HYBRID',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        11,
        'Registered Students List',
        'Official roll sheet of enrolled students per section from the registrar/ERP.',
        'SECTION_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        12,
        'Details of Internal Assessments; weightages, due dates, mapping to CO',
        'Assessment matrix: assignments, quizzes, projects, component weightages, due dates, and mapped COs.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        13,
        'Mid Semester Question papers with sample solutions',
        'Question papers for mid-term examination along with model answer key/solutions and evaluation rubrics.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        14,
        'Sample Evaluated Internal Submissions and Identification of weak students',
        'High, medium, and low evaluated answer scripts/assignments and documented list of identified weak students.',
        'SECTION_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        15,
        'Reflections from Mid-term semester feedback, interventions to enhance learning and improve teaching/learning strategies',
        'Faculty reflection on student feedback at mid-semester and actionable interventions deployed.',
        'HYBRID',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        16,
        'Interventions for slow performers and advanced learners (retest, resubmissions, etc.)',
        'Remedial measures, retests, resubmissions for slow learners, and enrichment projects for advanced learners.',
        'SECTION_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        17,
        'End Semester Question papers with sample solutions',
        'Final semester exam question paper, marking scheme, sample solutions, and rubrics.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        18,
        'Detail of Marks in all components up to End Semester',
        'Consolidated marks spreadsheet encompassing internal evaluations and end-semester scores.',
        'SECTION_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        19,
        'Attendance Report',
        'Final cumulative attendance report per section highlighting attendance percentage and shortfall list.',
        'SECTION_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        20,
        'Final record of Results (including grades)',
        'Final grade sheets, grade distribution analysis, and pass/fail summary.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        21,
        'Analyzing Direct Feedback received on Course Outcomes',
        'Direct student feedback analysis gathered specifically regarding CO attainment.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        22,
        'CO Attainment Measurement Analysis',
        'Quantitative attainment measurement against target thresholds and CO-PO gap analysis.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        23,
        'Feedback (class committee or otherwise) and corrective actions',
        'Minutes of Class Committee Meetings (CCM) and documented corrective actions implemented.',
        'HYBRID',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        24,
        'Faculty Course Review (innovative pedagogies, technology, experiential learning, alignment with university mission, feedback, CO attainment for next run)',
        'Comprehensive post-course retrospective by faculty detailing pedagogies, experiential learning, and next-run recommendations.',
        'COURSE_LEVEL',
        TRUE
    ),
    (
        (SELECT `template_id` FROM `course_file_templates` WHERE `template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'),
        25,
        'Any other additional information.',
        'Supplementary pedagogical evidence, industry expert guest lecture notes, certifications, or field visit reports.',
        'COURSE_LEVEL',
        FALSE
    )
ON DUPLICATE KEY UPDATE
    `section_title` = VALUES(`section_title`),
    `description` = VALUES(`description`),
    `scope_type` = VALUES(`scope_type`),
    `is_mandatory` = VALUES(`is_mandatory`);


-- ----------------------------------------------------------------------------
-- 10. CONVENIENCE VIEWS FOR MONITORING, AUDITING & VERIFICATION
-- ----------------------------------------------------------------------------

-- View: vw_template_25_sections
-- Displays the 25 sections in strictly ascending numerical order.
CREATE OR REPLACE VIEW `vw_template_25_sections` AS
SELECT
    ts.`section_number`,
    ts.`section_title`,
    ts.`scope_type`,
    ts.`is_mandatory`,
    t.`template_name`,
    t.`version`
FROM `template_sections` ts
INNER JOIN `course_file_templates` t ON ts.`template_id` = t.`template_id`
WHERE t.`template_code` = 'BMU_OFFICIAL_TEMPLATE_V1'
ORDER BY ts.`section_number` ASC;

-- View: vw_course_file_progress
-- High-level progress summary for Course Coordinators and Admins.
CREATE OR REPLACE VIEW `vw_course_file_progress` AS
SELECT
    cf.`course_file_id`,
    c.`course_code`,
    c.`course_title`,
    ay.`year_name` AS `academic_year`,
    sem.`semester_name`,
    u.`full_name` AS `coordinator_name`,
    u.`email` AS `coordinator_email`,
    cf.`status` AS `file_status`,
    COUNT(cfi.`item_id`) AS `total_items`,
    SUM(CASE WHEN cfi.`status` = 'APPROVED' THEN 1 ELSE 0 END) AS `approved_items`,
    SUM(CASE WHEN cfi.`status` = 'SUBMITTED' THEN 1 ELSE 0 END) AS `submitted_items`,
    SUM(CASE WHEN cfi.`status` = 'PENDING' THEN 1 ELSE 0 END) AS `pending_items`,
    SUM(CASE WHEN cfi.`status` = 'REVISION_REQUESTED' THEN 1 ELSE 0 END) AS `revision_items`,
    SUM(CASE WHEN cfi.`is_locked` = TRUE THEN 1 ELSE 0 END) AS `locked_items`,
    ROUND((SUM(CASE WHEN cfi.`status` = 'APPROVED' THEN 1 ELSE 0 END) / NULLIF(COUNT(cfi.`item_id`), 0)) * 100, 2) AS `completion_pct`
FROM `course_files` cf
INNER JOIN `course_offerings` co ON cf.`course_offering_id` = co.`course_offering_id`
INNER JOIN `courses` c ON co.`course_id` = c.`course_id`
INNER JOIN `semesters` sem ON co.`semester_id` = sem.`semester_id`
INNER JOIN `academic_years` ay ON sem.`academic_year_id` = ay.`academic_year_id`
INNER JOIN `users` u ON cf.`coordinator_id` = u.`user_id`
LEFT JOIN `course_file_items` cfi ON cf.`course_file_id` = cfi.`course_file_id`
GROUP BY
    cf.`course_file_id`,
    c.`course_code`,
    c.`course_title`,
    ay.`year_name`,
    sem.`semester_name`,
    u.`full_name`,
    u.`email`,
    cf.`status`;

-- View: vw_missing_submissions
-- Real-time tracking of pending or overdue submissions per faculty & section.
CREATE OR REPLACE VIEW `vw_missing_submissions` AS
SELECT
    cf.`course_file_id`,
    c.`course_code`,
    c.`course_title`,
    ts.`section_number`,
    ts.`section_title`,
    s.`section_name`,
    u.`full_name` AS `faculty_name`,
    u.`email` AS `faculty_email`,
    cfi.`submission_deadline`,
    cfi.`status` AS `submission_status`,
    cfi.`is_locked`,
    CASE
        WHEN cfi.`submission_deadline` IS NOT NULL AND cfi.`submission_deadline` < NOW() AND cfi.`status` IN ('PENDING', 'REVISION_REQUESTED')
        THEN 'OVERDUE'
        ELSE 'PENDING'
    END AS `urgency_status`
FROM `course_file_items` cfi
INNER JOIN `course_files` cf ON cfi.`course_file_id` = cf.`course_file_id`
INNER JOIN `course_offerings` co ON cf.`course_offering_id` = co.`course_offering_id`
INNER JOIN `courses` c ON co.`course_id` = c.`course_id`
INNER JOIN `template_sections` ts ON cfi.`template_section_id` = ts.`section_id`
LEFT JOIN `sections` s ON cfi.`section_id` = s.`section_id`
LEFT JOIN `users` u ON cfi.`assigned_faculty_id` = u.`user_id`
WHERE cfi.`status` IN ('PENDING', 'REVISION_REQUESTED');

-- View: vw_consolidated_source_traceability
-- Direct trace from compiled consolidated reports back to individual uploaded files & faculty.
CREATE OR REPLACE VIEW `vw_consolidated_source_traceability` AS
SELECT
    cc.`consolidated_id`,
    cc.`title` AS `consolidated_report_title`,
    cc.`consolidation_type`,
    cc.`is_ai_generated`,
    ccs.`source_role`,
    ds.`submission_id`,
    ds.`version_number`,
    ds.`file_name` AS `original_file_name`,
    ts.`section_number`,
    ts.`section_title`,
    u.`full_name` AS `uploaded_by_faculty`,
    ds.`uploaded_at`
FROM `consolidated_contents` cc
INNER JOIN `consolidated_content_sources` ccs ON cc.`consolidated_id` = ccs.`consolidated_id`
INNER JOIN `document_submissions` ds ON ccs.`submission_id` = ds.`submission_id`
INNER JOIN `course_file_items` cfi ON ds.`item_id` = cfi.`item_id`
INNER JOIN `template_sections` ts ON cfi.`template_section_id` = ts.`section_id`
INNER JOIN `users` u ON ds.`uploaded_by` = u.`user_id`;


-- ----------------------------------------------------------------------------
-- 11. VERIFICATION QUERIES (Run these to confirm complete setup)
-- ----------------------------------------------------------------------------

-- Verification Query 1: Verify total count of seeded sections is exactly 25
SELECT
    COUNT(*) AS `total_seeded_sections`,
    CASE WHEN COUNT(*) = 25 THEN 'SUCCESS: EXACTLY 25 SECTIONS PRESENT' ELSE 'ERROR: INCORRECT COUNT' END AS `verification_status`
FROM `template_sections` ts
INNER JOIN `course_file_templates` t ON ts.`template_id` = t.`template_id`
WHERE t.`template_code` = 'BMU_OFFICIAL_TEMPLATE_V1';

-- Verification Query 2: Display all 25 sections in exact order (1 to 25)
SELECT
    `section_number`,
    `section_title`,
    `scope_type`,
    `is_mandatory`
FROM `vw_template_25_sections`;

-- Verification Query 3: Confirm all tables exist in course_file_db
SELECT
    `table_name`,
    `table_rows`,
    `engine`
FROM information_schema.tables
WHERE `table_schema` = 'course_file_db'
ORDER BY `table_name` ASC;
