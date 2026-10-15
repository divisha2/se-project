import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CourseFile = sequelize.define('CourseFile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  coordinatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('collecting', 'locked', 'under_review', 'processing', 'draft_ready', 'content_accepted', 'finalized'),
    defaultValue: 'collecting'
  },
  completenessCheck: {
    type: DataTypes.JSONB,
    defaultValue: {
      allMandatorySectionsSubmitted: false,
      missingSections: [],
      lastChecked: null
    }
  },
  consolidatedContent: {
    type: DataTypes.JSONB,
    defaultValue: {
      path: null,
      generatedAt: null,
      aiProcessed: false
    }
  },
  finalCourseFile: {
    type: DataTypes.JSONB,
    defaultValue: {
      path: null,
      generatedAt: null,
      downloadUrl: null
    }
  },
  notifications: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  timestamps: true,
  tableName: 'course_files'
});

export default CourseFile;
