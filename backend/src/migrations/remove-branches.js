const { QueryInterface, Sequelize } = require('sequelize');

/**
 * Migration to remove branches table and branch_id column from users table
 */
module.exports = {
  up: async (queryInterface) => {
    // Remove branch_id column from transactions table if it exists
    const transactionsTable = await queryInterface.describeTable('transactions');
    if (transactionsTable.branch_id) {
      await queryInterface.removeColumn('transactions', 'branch_id');
      console.log('✅ Removed branch_id column from transactions table');
    }

    // Remove branch_id column from users table if it exists
    const usersTable = await queryInterface.describeTable('users');
    if (usersTable.branch_id) {
      await queryInterface.removeColumn('users', 'branch_id');
      console.log('✅ Removed branch_id column from users table');
    }

    // Drop branches table if it exists
    const tables = await queryInterface.showAllTables();
    if (tables.includes('branches')) {
      await queryInterface.dropTable('branches');
      console.log('✅ Dropped branches table');
    }
  },

  down: async (queryInterface) => {
    // Recreate branches table
    await queryInterface.createTable('branches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add branch_id column back to users table
    await queryInterface.addColumn('users', 'branch_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};
