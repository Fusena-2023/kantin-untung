const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 100],
      notEmpty: true,
    },
  },
  type: {
    type: DataTypes.ENUM('masuk', 'keluar', 'both'),
    allowNull: false,
    defaultValue: 'both',
    comment: 'masuk = kategori untuk pemasukan, keluar = kategori untuk pengeluaran, both = bisa untuk keduanya',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'category',
    comment: 'Material icon name untuk UI',
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'primary',
    comment: 'Quasar color untuk UI',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
    comment: 'Urutan tampil di dropdown',
  },
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['name'] },
    { fields: ['type'] },
    { fields: ['is_active'] },
    { fields: ['sort_order'] },
  ],
});

module.exports = Category;