import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Submission = sequelize.define('Submission', {
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
  section: {
    type: DataTypes.STRING
  },
  facultyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('not_submitted', 'in_progress', 'submitted', 'locked'),
    defaultValue: 'not_submitted'
  },
  submittedAt: {
    type: DataTypes.DATE
  },
  lockedAt: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  tableName: 'submissions'
});

export default Submission;
