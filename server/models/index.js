import sequelize from '../config/database.js';
import User from './User.js';
import Course from './Course.js';
import CourseFaculty from './CourseFaculty.js';
import File from './File.js';
import Submission from './Submission.js';
import CourseFile from './CourseFile.js';

// Define relationships
User.hasMany(Course, { foreignKey: 'coordinatorId', as: 'coordinatedCourses' });
Course.belongsTo(User, { foreignKey: 'coordinatorId', as: 'coordinator' });

Course.belongsToMany(User, { through: CourseFaculty, as: 'faculty', foreignKey: 'courseId' });
User.belongsToMany(Course, { through: CourseFaculty, as: 'assignedCourses', foreignKey: 'userId' });

Course.hasMany(File, { foreignKey: 'courseId', as: 'files' });
File.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(File, { foreignKey: 'uploadedById', as: 'uploadedFiles' });
File.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

Course.hasMany(Submission, { foreignKey: 'courseId', as: 'submissions' });
Submission.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(Submission, { foreignKey: 'facultyId', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'facultyId', as: 'faculty' });

Course.hasOne(CourseFile, { foreignKey: 'courseId', as: 'courseFile' });
CourseFile.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(CourseFile, { foreignKey: 'coordinatorId', as: 'managedCourseFiles' });
CourseFile.belongsTo(User, { foreignKey: 'coordinatorId', as: 'coordinator' });

export { sequelize, User, Course, CourseFaculty, File, Submission, CourseFile };
