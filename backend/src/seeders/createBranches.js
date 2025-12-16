const { Branch } = require('../models');

async function createDefaultBranches() {
  try {
    console.log('🔄 Creating branches...');
    
    await Branch.bulkCreate([
      {
        code: 'PABRIK',
        name: 'Kantin Pabrik',
        location: 'Area Pabrik',
        operatingHours: '06:00-18:00',
        isActive: true,
      },
      {
        code: 'KANTOR',
        name: 'Kantin Kantor',
        location: 'Area Kantor',
        operatingHours: '07:00-17:00',
        isActive: true,
      }
    ]);
    
    console.log('✅ Branches created successfully');
  } catch (error) {
    console.error('❌ Failed to create branches:', error);
    throw error;
  }
}

module.exports = { createDefaultBranches };
