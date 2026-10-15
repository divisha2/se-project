import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const File = sequelize.define('File', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER
  },
  mimetype: {
    type: DataTypes.STRING
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  section: {
    type: DataTypes.STRING
  },
  uploadedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.ENUM('syllabus', 'lecture_notes', 'assignments', 'grades', 'attendance', 'other'),
    defaultValue: 'other'
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('not_submitted', 'under_validation', 'invalid', 'valid', 'locked', 'included_in_final'),
    defaultValue: 'under_validation'
  },
  validationResult: {
    type: DataTypes.JSONB,
    defaultValue: {
      isValid: false,
      errors: [],
      checkedAt: null,
      checkedBy: null
    }
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  previousVersions: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  timestamps: true,
  tableName: 'files'
});

export default File;
