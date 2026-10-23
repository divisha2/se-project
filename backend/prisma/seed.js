
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const INITIAL_PASSWORD = "BMU@12345";

async function main() {
  console.log("Starting BMU Course File Management seed...");

  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, 12);

  // --------------------------------------------------
  // 1. ROLES
  // --------------------------------------------------

  const roleDefinitions = [
    ["ADMIN", "Administrator"],
    ["FACULTY", "Faculty Member"],
    ["COURSE_COORDINATOR", "Course Coordinator"],
  ];

  const roles = {};

  for (const [code, name] of roleDefinitions) {
    roles[code] = await prisma.role.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  }

  // --------------------------------------------------
  // 2. SCHOOL
  // --------------------------------------------------

  const school = await prisma.school.upsert({
    where: { code: "SET" },
    update: { name: "School of Engineering and Technology" },
    create: {
      code: "SET",
      name: "School of Engineering and Technology",
      vision: "Excellence in engineering education and research.",
      mission: "Develop skilled engineers through learning and innovation.",
    },
  });

  // --------------------------------------------------
  // 3. USERS: FOUR PER ROLE
  // --------------------------------------------------

  const usersByRole = {
    ADMIN: [],
    FACULTY: [],
    COURSE_COORDINATOR: [],
  };

  for (const [roleCode, roleName] of roleDefinitions) {
    for (let i = 1; i <= 4; i++) {
      const email = `${roleCode.toLowerCase()}${i}@bmu.example`;
      const employeeId =
        `BMU-${roleCode}-${String(i).padStart(3, "0")}`;

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          employeeId,
          fullName: `${roleName} ${i}`,
          schoolId: school.id,
          isActive: true,
        },
        create: {
          employeeId,
          email,
          fullName: `${roleName} ${i}`,
          passwordHash,
          mustChangePassword: true,
          isActive: true,
          schoolId: school.id,
          department: "Computer Science",
          designation: roleName,
        },
      });

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: roles[roleCode].id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: roles[roleCode].id,
        },
      });

      usersByRole[roleCode].push(user);
    }
  }

  // --------------------------------------------------
  // 4. PROGRAM
  // --------------------------------------------------

  const program = await prisma.program.upsert({
    where: { code: "BTECH-CSE" },
    update: {
      name: "B.Tech Computer Science and Engineering",
      schoolId: school.id,
    },
    create: {
      schoolId: school.id,
      code: "BTECH-CSE",
      name: "B.Tech Computer Science and Engineering",
      degreeLevel: "UG",
      peos: "Prepare graduates for professional engineering careers.",
      posPsos: "Develop technical, analytical, and problem-solving skills.",
    },
  });

  // --------------------------------------------------
  // 5. ACADEMIC YEAR AND SEMESTER
  // --------------------------------------------------

  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2026-2027" },
    update: {
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2027-06-30T00:00:00.000Z"),
      isActive: true,
    },
    create: {
      name: "2026-2027",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2027-06-30T00:00:00.000Z"),
      isActive: true,
    },
  });

  const semester = await prisma.semester.upsert({
    where: {
      academicYearId_type_name: {
        academicYearId: academicYear.id,
        type: "ODD",
        name: "Semester 5",
      },
    },
    update: {
      startDate: new Date("2026-07-15T00:00:00.000Z"),
      endDate: new Date("2026-12-15T00:00:00.000Z"),
      isCurrent: true,
    },
    create: {
      academicYearId: academicYear.id,
      type: "ODD",
      name: "Semester 5",
      startDate: new Date("2026-07-15T00:00:00.000Z"),
      endDate: new Date("2026-12-15T00:00:00.000Z"),
      isCurrent: true,
    },
  });

  // --------------------------------------------------
  // 6. COURSE FILE TEMPLATE AND 25 TEMPLATE SECTIONS
  // --------------------------------------------------

  const template = await prisma.courseFileTemplate.upsert({
    where: { code: "BMU-CF-2026" },
    update: {
      name: "BMU Standard Course File Template",
      version: "1.0",
      isActive: true,
    },
    create: {
      code: "BMU-CF-2026",
      name: "BMU Standard Course File Template",
      version: "1.0",
      description: "Standard template for course file preparation.",
      isActive: true,
    },
  });

  const sectionTitles = [
    "Course Syllabus",
    "Course Objectives",
    "Course Outcomes",
    "CO-PO/PSO Mapping",
    "Course Delivery Plan",
    "Teaching Methodology",
    "Assessment Policy",
    "Course Coordinator Information",
    "Lecture Notes",
    "Lecture-wise Teaching Plan",
    "Attendance Records",
    "Assignment Questions",
    "Assignment Solutions",
    "Internal Assessment Question Papers",
    "Internal Assessment Answer Scripts",
    "Internal Assessment Marks",
    "Tutorial and Laboratory Records",
    "Student Performance Analysis",
    "Remedial Teaching Records",
    "Student Feedback",
    "Course Outcome Attainment",
    "Question Paper CO Mapping",
    "Previous Examination Papers",
    "Course Completion Report",
    "Additional Supporting Documents",
  ];

  const templateSections = [];

  for (let i = 0; i < sectionTitles.length; i++) {
    const number = i + 1;

    // Sections 1-8 are course-level.
    // Sections 9-25 are section-level.
    const scope = number <= 8 ? "COURSE_LEVEL" : "SECTION_LEVEL";
    const mandatory = number !== 25;

    const section = await prisma.templateSection.upsert({
      where: {
        templateId_number: {
          templateId: template.id,
          number,
        },
      },
      update: {
        title: sectionTitles[i],
        scope,
        mandatory,
      },
      create: {
        templateId: template.id,
        number,
        title: sectionTitles[i],
        description: `Course file section ${number}: ${sectionTitles[i]}`,
        scope,
        mandatory,
      },
    });

    templateSections.push(section);
  }

  // --------------------------------------------------
  // 7. COURSES
  // --------------------------------------------------

  const courseDefinitions = [
    {
      code: "CSE301",
      title: "Database Management Systems",
      credits: 4.0,
      description: "Database design, SQL, normalization, and transactions.",
    },
    {
      code: "CSE302",
      title: "Software Engineering",
      credits: 3.0,
      description: "Software development processes, testing, and design.",
    },
    {
      code: "CSE303",
      title: "Artificial Intelligence",
      credits: 3.0,
      description: "Search, knowledge representation, and intelligent agents.",
    },
  ];

  const courses = [];

  for (const definition of courseDefinitions) {
    const course = await prisma.course.upsert({
      where: { code: definition.code },
      update: {
        title: definition.title,
        credits: definition.credits,
        description: definition.description,
        programId: program.id,
        isActive: true,
      },
      create: {
        programId: program.id,
        code: definition.code,
        title: definition.title,
        credits: definition.credits,
        description: definition.description,
        objectives: `Understand and apply concepts in ${definition.title}.`,
        syllabus: `Sample syllabus for ${definition.title}.`,
        isActive: true,
      },
    });

    courses.push(course);
  }

  // --------------------------------------------------
  // 8. COURSE OUTCOMES
  // --------------------------------------------------

  const outcomeDefinitions = [
    { code: "CO1", description: "Understand fundamental concepts." },
    { code: "CO2", description: "Apply concepts to solve problems." },
    { code: "CO3", description: "Analyze and evaluate solutions." },
  ];

  for (const course of courses) {
    for (const outcome of outcomeDefinitions) {
      await prisma.courseOutcome.upsert({
        where: {
          courseId_code: {
            courseId: course.id,
            code: outcome.code,
          },
        },
        update: { description: outcome.description },
        create: {
          courseId: course.id,
          code: outcome.code,
          description: outcome.description,
          type: "CO",
        },
      });
    }
  }

  // --------------------------------------------------
  // 9. OFFERINGS, COURSE FILES, SECTIONS AND ASSIGNMENTS
  // --------------------------------------------------

  const faculty = usersByRole.FACULTY;
  const coordinators = usersByRole.COURSE_COORDINATOR;

  const sectionNames = ["A", "B"];
  const createdCourseFiles = [];

  for (let c = 0; c < courses.length; c++) {
    const course = courses[c];
    const coordinator = coordinators[c];

    const offering = await prisma.courseOffering.upsert({
      where: {
        courseId_semesterId: {
          courseId: course.id,
          semesterId: semester.id,
        },
      },
      update: {
        coordinatorId: coordinator.id,
        status: "ACTIVE",
      },
      create: {
        courseId: course.id,
        semesterId: semester.id,
        coordinatorId: coordinator.id,
        status: "ACTIVE",
      },
    });

    const courseFile = await prisma.courseFile.upsert({
      where: { courseOfferingId: offering.id },
      update: {
        templateId: template.id,
        status: c === 0 ? "IN_PROGRESS" : "DRAFT",
      },
      create: {
        courseOfferingId: offering.id,
        templateId: template.id,
        status: c === 0 ? "IN_PROGRESS" : "DRAFT",
      },
    });

    createdCourseFiles.push(courseFile);

    const sections = [];

    for (const sectionName of sectionNames) {
      const section = await prisma.section.upsert({
        where: {
          courseOfferingId_name: {
            courseOfferingId: offering.id,
            name: sectionName,
          },
        },
        update: { capacity: 60 },
        create: {
          courseOfferingId: offering.id,
          name: sectionName,
          capacity: 60,
        },
      });

      sections.push(section);
    }

    // Assign two faculty members to each course section.
    for (let s = 0; s < sections.length; s++) {
      const section = sections[s];
      const firstFaculty = faculty[(c + s) % faculty.length];
      const secondFaculty = faculty[(c + s + 1) % faculty.length];

      const assignments = [
        {
          user: firstFaculty,
          role: "PRIMARY_INSTRUCTOR",
        },
        {
          user: secondFaculty,
          role: "LAB_INSTRUCTOR",
        },
      ];

      for (const assignment of assignments) {
        // Existing schema allows only one assignment per
        // faculty member per section, regardless of role.
        const existing = await prisma.sectionFacultyAssignment.findFirst({
          where: {
            sectionId: section.id,
            facultyId: assignment.user.id,
          },
        });

        if (existing) {
          await prisma.sectionFacultyAssignment.update({
            where: { id: existing.id },
            data: { assignmentRole: assignment.role },
          });
        } else {
          await prisma.sectionFacultyAssignment.create({
            data: {
              sectionId: section.id,
              facultyId: assignment.user.id,
              assignmentRole: assignment.role,
            },
          });
        }
      }
    }

    // ------------------------------------------------
    // 10. CREATE COURSE FILE ITEMS
    // ------------------------------------------------

    for (const templateSection of templateSections) {
      const isCourseLevel = templateSection.scope === "COURSE_LEVEL";

      // Course-level sections get one item with sectionId = null.
      // Section-level sections get one item per course section.
      const targetSections = isCourseLevel ? [null] : sections;

      for (const targetSection of targetSections) {
        const assignedUser = isCourseLevel
          ? coordinator
          : faculty[
              (c + sections.indexOf(targetSection)) % faculty.length
            ];

        const itemData = {
          courseFileId: courseFile.id,
          templateSectionId: templateSection.id,
          sectionId: targetSection ? targetSection.id : null,
        };

        const existingItem = await prisma.courseFileItem.findFirst({
          where: itemData,
        });

        // Seed a few items in different states for dashboard testing.
        let status = "PENDING";

        if (
          templateSection.number === 9 ||
          templateSection.number === 12
        ) {
          status = c === 0 ? "SUBMITTED" : "PENDING";
        }

        if (templateSection.number === 10 && c === 0) {
          status = "UNDER_REVIEW";
        }

        if (templateSection.number === 1 && isCourseLevel && c === 0) {
          status = "APPROVED";
        }

        const deadline = new Date("2026-11-15T00:00:00.000Z");

        const item = existingItem
          ? await prisma.courseFileItem.update({
              where: { id: existingItem.id },
              data: {
                assignedFacultyId: assignedUser.id,
                status,
                deadline,
              },
            })
          : await prisma.courseFileItem.create({
              data: {
                ...itemData,
                assignedFacultyId: assignedUser.id,
                status,
                deadline,
              },
            });

        // --------------------------------------------
        // 11. SAMPLE DOCUMENT SUBMISSIONS
        // --------------------------------------------

        // Create example submissions for selected items.
        const shouldHaveSubmission =
          (templateSection.number === 9 ||
            templateSection.number === 12) &&
          c === 0;

        if (shouldHaveSubmission) {
          const versionNumber = 1;

          await prisma.documentSubmission.upsert({
            where: {
              itemId_versionNumber: {
                itemId: item.id,
                versionNumber,
              },
            },
            update: {
              uploadedBy: assignedUser.id,
              isCurrentVersion: true,
              isDeleted: false,
            },
            create: {
              itemId: item.id,
              versionNumber,
              fileName: `${course.code}_Section_${templateSection.number}_${targetSection ? targetSection.name : "Course"}.pdf`,
              storagePath: `seed/sample/${course.code}/section-${templateSection.number}.pdf`,
              fileSizeBytes: BigInt(102400),
              mimeType: "application/pdf",
              checksumSha256: null,
              uploadedBy: assignedUser.id,
              notes: "Sample seed submission for workflow testing.",
              isCurrentVersion: true,
              validationStatus: "NOT_CHECKED",
              isDeleted: false,
            },
          });
        }
      }
    }
  }

  // --------------------------------------------------
  // 12. SUMMARY
  // --------------------------------------------------

  const userCount = await prisma.user.count();
  const courseCount = await prisma.course.count();
  const courseFileCount = await prisma.courseFile.count();
  const itemCount = await prisma.courseFileItem.count();
  const submissionCount = await prisma.documentSubmission.count();

  console.log("\n========== BMU SEED COMPLETED ==========");
  console.log(`Users in database: ${userCount}`);
  console.log("Test users created/updated: 12 (4 per role)");
  console.log(`Courses in database: ${courseCount}`);
  console.log(`Course files in database: ${courseFileCount}`);
  console.log(`Course file items in database: ${itemCount}`);
  console.log(`Document submissions in database: ${submissionCount}`);
  console.log(`Template sections: ${templateSections.length}`);
  console.log("\nShared test password:", INITIAL_PASSWORD);
  console.log("\nTest login emails:");

  for (const [roleCode] of roleDefinitions) {
    console.log(`\n${roleCode}:`);
    for (let i = 1; i <= 4; i++) {
      console.log(`  ${roleCode.toLowerCase()}${i}@bmu.example`);
    }
  }

  console.log("\n========================================");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
