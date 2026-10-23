// ============================================================================
// BMU Course File Management System - Mock Data
// ============================================================================

export const TEMPLATE_SECTIONS = [
  { number: 1, title: 'Course Details: Course Code, Course Title, Semester/Term/Module, Year.', scope: 'COORDINATOR', mandatory: true },
  { number: 2, title: 'Vision and Mission of the University.', scope: 'COORDINATOR', mandatory: true },
  { number: 3, title: 'Graduate Attributes of BMU Students.', scope: 'COORDINATOR', mandatory: true },
  { number: 4, title: 'Vision and Mission of the School.', scope: 'COORDINATOR', mandatory: true },
  { number: 5, title: 'PEOs, POs and PSOs of the Program.', scope: 'COORDINATOR', mandatory: true },
  { number: 6, title: 'Course Description and Objectives.', scope: 'COORDINATOR', mandatory: true },
  { number: 7, title: 'Course Outcomes and CO–PO Mapping.', scope: 'COORDINATOR', mandatory: true },
  { number: 8, title: 'Course Syllabus, including module-wise content and teaching hours, readings, activities, teaching strategy, module-to-CO mapping, textbooks, reference books and other learning resources.', scope: 'COORDINATOR', mandatory: true },
  { number: 9, title: 'Detailed Session-wise Plan.', scope: 'COORDINATOR', mandatory: true },
  { number: 10, title: 'Weekly Timetable.', scope: 'COORDINATOR', mandatory: true },
  { number: 11, title: 'Registered Students List.', scope: 'COORDINATOR', mandatory: true },
  { number: 12, title: 'Details of Internal Assessments, including weightages, due dates and mapping to CO.', scope: 'FACULTY', mandatory: true },
  { number: 13, title: 'Mid-Semester Question Papers with Sample Solutions.', scope: 'FACULTY', mandatory: true },
  { number: 14, title: 'Sample Evaluated Internal Submissions and Identification of Weak Students.', scope: 'FACULTY', mandatory: true },
  { number: 15, title: 'Reflections on Mid-Term Semester Feedback and Interventions to Improve Student Learning and Teaching Strategies.', scope: 'FACULTY', mandatory: true },
  { number: 16, title: 'Interventions for Slow Performers and Advanced Learners, including retests, resubmissions and other improvement initiatives.', scope: 'FACULTY', mandatory: true },
  { number: 17, title: 'End-Semester Question Papers with Sample Solutions.', scope: 'FACULTY', mandatory: true },
  { number: 18, title: 'Details of Marks in All Components up to the End Semester.', scope: 'FACULTY', mandatory: true },
  { number: 19, title: 'Attendance Report.', scope: 'FACULTY', mandatory: true },
  { number: 20, title: 'Final Record of Results, Including Grades.', scope: 'FACULTY', mandatory: true },
  { number: 21, title: 'Analysis of Direct Feedback Received on Course Outcomes.', scope: 'FACULTY', mandatory: true },
  { number: 22, title: 'CO Attainment Measurement Analysis.', scope: 'FACULTY', mandatory: true },
  { number: 23, title: 'Feedback from Class Committee or Other Sources and Corrective Actions.', scope: 'FACULTY', mandatory: true },
  { number: 24, title: 'Faculty Course Review, Including Innovative Pedagogies, Technology, Experiential Learning, Integration with University Vision and Mission, Feedback, and Course Outcome Attainment for the Next Course Run.', scope: 'FACULTY', mandatory: true },
  { number: 25, title: 'Any Other Additional Information.', scope: 'FACULTY', mandatory: false },
];

export const USERS = [
  { id: 1, name: 'Dr. Rajesh Kumar', email: 'admin@bmu.edu.in', password: 'admin123', role: 'admin', department: 'Administration', designation: 'System Administrator', employeeId: 'BMU-ADM-001' },
  { id: 2, name: 'Dr. Priya Sharma', email: 'priya.sharma@bmu.edu.in', password: 'faculty123', role: 'faculty', department: 'School of Engineering and Technology', designation: 'Associate Professor', employeeId: 'BMU-FAC-1024' },
  { id: 3, name: 'Dr. Amit Verma', email: 'amit.verma@bmu.edu.in', password: 'faculty123', role: 'faculty', department: 'School of Engineering and Technology', designation: 'Assistant Professor', employeeId: 'BMU-FAC-1031' },
  { id: 4, name: 'Dr. Neha Gupta', email: 'neha.gupta@bmu.edu.in', password: 'coord123', role: 'coordinator', department: 'School of Engineering and Technology', designation: 'Professor', employeeId: 'BMU-FAC-1005' },
  { id: 5, name: 'Dr. Sanjay Patel', email: 'sanjay.patel@bmu.edu.in', password: 'faculty123', role: 'faculty', department: 'School of Management', designation: 'Assistant Professor', employeeId: 'BMU-FAC-2010' },
  { id: 6, name: 'Dr. Meera Joshi', email: 'meera.joshi@bmu.edu.in', password: 'coord123', role: 'coordinator', department: 'School of Management', designation: 'Associate Professor', employeeId: 'BMU-FAC-2003' },
];

export const COURSES = [
  { id: 1, code: 'CSE2001', title: 'Data Structures and Algorithms', credits: 4, programId: 1, programName: 'B.Tech CSE', school: 'SOET' },
  { id: 2, code: 'CSE3002', title: 'Database Management Systems', credits: 3, programId: 1, programName: 'B.Tech CSE', school: 'SOET' },
  { id: 3, code: 'CSE4001', title: 'Machine Learning', credits: 4, programId: 1, programName: 'B.Tech CSE', school: 'SOET' },
  { id: 4, code: 'MGT2001', title: 'Principles of Management', credits: 3, programId: 2, programName: 'BBA', school: 'SOM' },
  { id: 5, code: 'ECE2003', title: 'Digital Electronics', credits: 3, programId: 3, programName: 'B.Tech ECE', school: 'SOET' },
];

export const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027'];
export const SEMESTERS = ['Odd Semester (Fall)', 'Even Semester (Spring)', 'Summer Semester'];

export const COURSE_OFFERINGS = [
  {
    id: 1,
    courseId: 1,
    course: COURSES[0],
    academicYear: '2026-2027',
    semester: 'Odd Semester (Fall)',
    coordinatorId: 4,
    coordinator: USERS[3],
    status: 'ACTIVE',
    sections: [
      { id: 1, name: 'Section A', facultyId: 2, faculty: USERS[1] },
      { id: 2, name: 'Section B', facultyId: 3, faculty: USERS[2] },
    ],
    completionPct: 48,
  },
  {
    id: 2,
    courseId: 2,
    course: COURSES[1],
    academicYear: '2026-2027',
    semester: 'Odd Semester (Fall)',
    coordinatorId: 4,
    coordinator: USERS[3],
    status: 'ACTIVE',
    sections: [
      { id: 3, name: 'Section A', facultyId: 2, faculty: USERS[1] },
    ],
    completionPct: 32,
  },
  {
    id: 3,
    courseId: 4,
    course: COURSES[3],
    academicYear: '2026-2027',
    semester: 'Odd Semester (Fall)',
    coordinatorId: 6,
    coordinator: USERS[5],
    status: 'ACTIVE',
    sections: [
      { id: 4, name: 'Section A', facultyId: 5, faculty: USERS[4] },
    ],
    completionPct: 20,
  },
];

// Statuses: MISSING, SUBMITTED, UNDER_REVIEW, APPROVED, CORRECTION_REQUIRED
const createFile = (name, type, size, date) => ({
  id: Math.random().toString(36).substring(2, 9),
  name,
  type,
  size,
  uploadDate: date,
});

// Coordinator uploads for offering 1 (DSA - CSE2001)
export const COORDINATOR_UPLOADS = {
  1: {
    1: { status: 'APPROVED', files: [createFile('CSE2001_Course_Details.pdf', 'application/pdf', '245 KB', '2026-08-15')], feedback: null },
    2: { status: 'APPROVED', files: [createFile('BMU_Vision_Mission.pdf', 'application/pdf', '180 KB', '2026-08-15')], feedback: null },
    3: { status: 'APPROVED', files: [createFile('Graduate_Attributes.pdf', 'application/pdf', '320 KB', '2026-08-15')], feedback: null },
    4: { status: 'SUBMITTED', files: [createFile('SOET_Vision_Mission.pdf', 'application/pdf', '195 KB', '2026-08-20')], feedback: null },
    5: { status: 'SUBMITTED', files: [createFile('PEOs_POs_PSOs_BTech_CSE.pdf', 'application/pdf', '410 KB', '2026-08-20')], feedback: null },
    6: { status: 'APPROVED', files: [createFile('DSA_Course_Description.pdf', 'application/pdf', '290 KB', '2026-08-18'), createFile('DSA_Objectives.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '125 KB', '2026-08-18')], feedback: null },
    7: { status: 'CORRECTION_REQUIRED', files: [createFile('CO_PO_Mapping_v1.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '85 KB', '2026-08-22')], feedback: 'Please update mapping for CO4 and CO5. The current mapping does not align with the revised POs.' },
    8: { status: 'SUBMITTED', files: [createFile('DSA_Syllabus_2026.pdf', 'application/pdf', '520 KB', '2026-08-25'), createFile('Module_CO_Mapping.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '78 KB', '2026-08-25')], feedback: null },
    9: { status: 'SUBMITTED', files: [createFile('Session_Plan_DSA.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '156 KB', '2026-08-28')], feedback: null },
    10: { status: 'MISSING', files: [], feedback: null },
    11: { status: 'SUBMITTED', files: [createFile('Students_SecA.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '45 KB', '2026-09-01'), createFile('Students_SecB.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '42 KB', '2026-09-01')], feedback: null },
  },
  2: {
    1: { status: 'APPROVED', files: [createFile('CSE3002_Course_Details.pdf', 'application/pdf', '210 KB', '2026-08-16')], feedback: null },
    2: { status: 'APPROVED', files: [createFile('BMU_Vision_Mission.pdf', 'application/pdf', '180 KB', '2026-08-16')], feedback: null },
    3: { status: 'SUBMITTED', files: [createFile('Graduate_Attributes.pdf', 'application/pdf', '320 KB', '2026-08-16')], feedback: null },
    4: { status: 'MISSING', files: [], feedback: null },
    5: { status: 'MISSING', files: [], feedback: null },
    6: { status: 'SUBMITTED', files: [createFile('DBMS_Description.pdf', 'application/pdf', '250 KB', '2026-08-20')], feedback: null },
    7: { status: 'MISSING', files: [], feedback: null },
    8: { status: 'SUBMITTED', files: [createFile('DBMS_Syllabus.pdf', 'application/pdf', '480 KB', '2026-08-22')], feedback: null },
    9: { status: 'MISSING', files: [], feedback: null },
    10: { status: 'MISSING', files: [], feedback: null },
    11: { status: 'MISSING', files: [], feedback: null },
  },
};

// Faculty uploads - keyed by offeringId -> facultyId -> sectionNumber
export const FACULTY_UPLOADS = {
  1: {
    2: { // Dr. Priya Sharma - Section A
      12: { status: 'APPROVED', files: [createFile('IA_Details_SecA.pdf', 'application/pdf', '340 KB', '2026-09-10'), createFile('Assessment_Weightages.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '55 KB', '2026-09-10')], feedback: null },
      13: { status: 'SUBMITTED', files: [createFile('MidSem_QP_DSA.pdf', 'application/pdf', '890 KB', '2026-10-05'), createFile('MidSem_Solutions.pdf', 'application/pdf', '1.2 MB', '2026-10-05')], feedback: null },
      14: { status: 'CORRECTION_REQUIRED', files: [createFile('Evaluated_Samples_SecA.pdf', 'application/pdf', '2.5 MB', '2026-10-12')], feedback: 'Please include at least 3 evaluated samples (top, mid, bottom performer). Only top performer sample is attached.' },
      15: { status: 'MISSING', files: [], feedback: null },
      16: { status: 'MISSING', files: [], feedback: null },
      17: { status: 'MISSING', files: [], feedback: null },
      18: { status: 'MISSING', files: [], feedback: null },
      19: { status: 'SUBMITTED', files: [createFile('Attendance_SecA_Sep.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '78 KB', '2026-10-01'), createFile('Attendance_SecA_Oct.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '82 KB', '2026-10-15')], feedback: null },
      20: { status: 'MISSING', files: [], feedback: null },
      21: { status: 'MISSING', files: [], feedback: null },
      22: { status: 'MISSING', files: [], feedback: null },
      23: { status: 'MISSING', files: [], feedback: null },
      24: { status: 'MISSING', files: [], feedback: null },
      25: { status: 'MISSING', files: [], feedback: null },
    },
    3: { // Dr. Amit Verma - Section B
      12: { status: 'SUBMITTED', files: [createFile('IA_Details_SecB.pdf', 'application/pdf', '310 KB', '2026-09-12')], feedback: null },
      13: { status: 'SUBMITTED', files: [createFile('MidSem_QP_DSA_SecB.pdf', 'application/pdf', '750 KB', '2026-10-06')], feedback: null },
      14: { status: 'MISSING', files: [], feedback: null },
      15: { status: 'SUBMITTED', files: [createFile('MidTerm_Feedback_Reflection.pdf', 'application/pdf', '420 KB', '2026-10-08')], feedback: null },
      16: { status: 'MISSING', files: [], feedback: null },
      17: { status: 'MISSING', files: [], feedback: null },
      18: { status: 'MISSING', files: [], feedback: null },
      19: { status: 'SUBMITTED', files: [createFile('Attendance_SecB.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '75 KB', '2026-10-10')], feedback: null },
      20: { status: 'MISSING', files: [], feedback: null },
      21: { status: 'MISSING', files: [], feedback: null },
      22: { status: 'MISSING', files: [], feedback: null },
      23: { status: 'MISSING', files: [], feedback: null },
      24: { status: 'MISSING', files: [], feedback: null },
      25: { status: 'MISSING', files: [], feedback: null },
    },
  },
  2: {
    2: { // Dr. Priya Sharma - DBMS Section A
      12: { status: 'SUBMITTED', files: [createFile('IA_Details_DBMS.pdf', 'application/pdf', '280 KB', '2026-09-15')], feedback: null },
      13: { status: 'MISSING', files: [], feedback: null },
      14: { status: 'MISSING', files: [], feedback: null },
      15: { status: 'MISSING', files: [], feedback: null },
      16: { status: 'MISSING', files: [], feedback: null },
      17: { status: 'MISSING', files: [], feedback: null },
      18: { status: 'MISSING', files: [], feedback: null },
      19: { status: 'MISSING', files: [], feedback: null },
      20: { status: 'MISSING', files: [], feedback: null },
      21: { status: 'MISSING', files: [], feedback: null },
      22: { status: 'MISSING', files: [], feedback: null },
      23: { status: 'MISSING', files: [], feedback: null },
      24: { status: 'MISSING', files: [], feedback: null },
      25: { status: 'MISSING', files: [], feedback: null },
    },
  },
};

export const NOTIFICATIONS = [
  { id: 1, message: 'CO-PO Mapping requires correction for CSE2001', type: 'warning', date: '2026-10-20', read: false },
  { id: 2, message: 'Dr. Priya Sharma uploaded Mid-Semester QP for CSE2001 Sec A', type: 'info', date: '2026-10-05', read: true },
  { id: 3, message: 'Weekly Timetable is missing for CSE2001', type: 'error', date: '2026-10-18', read: false },
  { id: 4, message: 'Evaluated samples need revision - CSE2001 Section A', type: 'warning', date: '2026-10-12', read: false },
  { id: 5, message: 'New course assignment: CSE3002 DBMS', type: 'info', date: '2026-08-16', read: true },
];
