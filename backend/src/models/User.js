const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true,
    },
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'full_name',
    validate: {
      len: [2, 100],
      notEmpty: true,
    },
  },
  role: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2, // Default ke pegawai (ID = 2)
    references: {
      model: 'roles',
      key: 'id'
    },
    field: 'role_id',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login',
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['username'] },
    { fields: ['email'] },
    { fields: ['role_id'] }, // Gunakan nama kolom yang benar
    { fields: ['is_active'] },
  ],
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;