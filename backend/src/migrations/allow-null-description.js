const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    try {
      // Alter description column to allow null
      await queryInterface.changeColumn(
        'transactions',
        'description',
        {
          type: DataTypes.TEXT,
          allowNull: true,
        }
      );
      console.log('✅ Migration: Allow null description in transactions table');
    } catch (error) {
      console.error('❌ Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    try {
      // Revert: Make description not nullable
      await queryInterface.changeColumn(
        'transactions',
        'description',
        {
          type: DataTypes.TEXT,
          allowNull: false,
        }
      );
      console.log('✅ Reverted: Description column reverted to NOT NULL');
    } catch (error) {
      console.error('❌ Revert error:', error);
      throw error;
    }
  }
};
