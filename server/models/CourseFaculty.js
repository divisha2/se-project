import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CourseFaculty = sequelize.define('CourseFaculty', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  section: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  tableName: 'course_faculty'
});

export default CourseFaculty;
