import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  coordinatorId: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  semester: {
    type: DataTypes.STRING
  },
  year: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM(
      'unassigned', 'assigned', 'collecting', 'locked', 
      'under_review', 'processing', 'finalized', 'archived'
    ),
    defaultValue: 'unassigned'
  },
  submissionDeadline: {
    type: DataTypes.DATE
  },
  mandatorySections: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  timestamps: true,
  tableName: 'courses'
});

export default Course;
