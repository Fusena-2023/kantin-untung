const { sequelize } = require('../models');

async function removeNotesField() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('🔄 Starting migration: Remove notes field from transactions table...');

    // Check if column exists before dropping
    const tableDescription = await queryInterface.describeTable('transactions');
    
    if (tableDescription.notes) {
      console.log('📝 Dropping notes column from transactions table...');
      await queryInterface.removeColumn('transactions', 'notes');
      console.log('✅ Notes column removed successfully');
    } else {
      console.log('ℹ️  Notes column does not exist, skipping...');
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  removeNotesField()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = removeNotesField;
