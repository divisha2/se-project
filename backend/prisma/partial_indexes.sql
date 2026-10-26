
-- Prevent duplicate course-level items where sectionId is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS "CourseFileItem_course_level_key"
    ON "CourseFileItem" ("courseFileId", "templateSectionId")
    WHERE "sectionId" IS NULL;

-- Allow only one current, non-deleted submission per course-file item.
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentSubmission_one_current_per_item"
    ON "DocumentSubmission" ("itemId")
    WHERE "isCurrentVersion" = TRUE AND "isDeleted" = FALSE;

-- One part-submission row per (course file, part, section); and one per
-- (course file, part) for the course-level part where sectionId is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS "PartSubmission_section_key"
    ON "PartSubmission" ("courseFileId", "partId", "sectionId")
    WHERE "sectionId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "PartSubmission_course_level_key"
    ON "PartSubmission" ("courseFileId", "partId")
    WHERE "sectionId" IS NULL;
