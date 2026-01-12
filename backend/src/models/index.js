const sequelize = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');
const Role = require('./Role');
const Category = require('./Category');
const PlateCount = require('./PlateCount');

// Define associations
User.hasMany(Transaction, {
  foreignKey: 'userId',
  as: 'transactions',
});

Transaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Role associations
Role.hasMany(User, {
  foreignKey: 'role',
  as: 'users',
});

User.belongsTo(Role, {
  foreignKey: 'role',
  as: 'userRole',
});

// PlateCount associations
User.hasMany(PlateCount, {
  foreignKey: 'userId',
  as: 'plateCounts',
});

PlateCount.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = {
  sequelize,
  User,
  Transaction,
  Role,
  Category,
  PlateCount,
};