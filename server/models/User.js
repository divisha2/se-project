import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'faculty', 'coordinator'),
    defaultValue: 'faculty'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'deactivated'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true,
  tableName: 'users'
});

export default User;
