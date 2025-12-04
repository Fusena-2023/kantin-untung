const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: false, // Manual set ID
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true,
    },
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'display_name',
    validate: {
      len: [3, 100],
      notEmpty: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of permission strings',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['name'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Role;