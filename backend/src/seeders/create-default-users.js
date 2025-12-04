const { User, Role } = require('../models');
const sequelize = require('../config/database');

async function createDefaultUsers() {
  try {
    console.log('🚀 Memulai proses pembuatan role dan user default...');

    // Create roles first
    await createDefaultRoles();
    
    // Create default users
    await createDefaultUsersData();

    console.log('✅ Proses selesai! Default users telah dibuat.');
  } catch (error) {
    console.error('❌ Error creating default users:', error);
    process.exit(1);
  }
}

async function createDefaultRoles() {
  console.log('📝 Membuat default roles...');

  // Check if roles already exist
  const existingRoles = await Role.findAll();
  if (existingRoles.length > 0) {
    console.log('ℹ️  Roles sudah ada, skip pembuatan role');
    return;
  }

  const roles = [
    {
      id: 1,
      name: 'pemilik',
      displayName: 'Pemilik',
      description: 'Pemilik kantin dengan akses penuh',
      permissions: [
        'view_all_transactions',
        'create_transaction', 
        'edit_transaction',
        'delete_transaction',
        'view_reports',
        'manage_users',
        'create_user',
        'edit_user',
        'delete_user',
        'view_dashboard'
      ],
      isActive: true
    },
    {
      id: 2,
      name: 'pegawai',
      displayName: 'Pegawai',
      description: 'Pegawai kantin dengan akses terbatas',
      permissions: [
        'view_own_transactions',
        'create_transaction'
      ],
      isActive: true
    }
  ];

  for (const roleData of roles) {
    await Role.create(roleData);
    console.log(`✅ Role ${roleData.displayName} berhasil dibuat`);
  }
}

async function createDefaultUsersData() {
  console.log('👥 Membuat default users...');

  // Check if users already exist
  const existingUsers = await User.findAll();
  if (existingUsers.length > 0) {
    console.log('ℹ️  Ada user yang sudah exist:');
    existingUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.fullName})`);
    });
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Apakah Anda ingin tetap membuat user default? (y/n): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Proses dibatalkan');
      return;
    }
  }

  const users = [
    {
      username: 'admin',
      email: 'admin@kantin.com',
      password: 'admin123',
      fullName: 'Administrator Pemilik',
      role: 1, // pemilik
      isActive: true
    },
    {
      username: 'pegawai1',
      email: 'pegawai1@kantin.com', 
      password: 'pegawai123',
      fullName: 'Pegawai Satu',
      role: 2, // pegawai
      isActive: true
    },
    {
      username: 'pegawai2',
      email: 'pegawai2@kantin.com',
      password: 'pegawai123', 
      fullName: 'Pegawai Dua',
      role: 2, // pegawai
      isActive: true
    }
  ];

  for (const userData of users) {
    try {
      // Check if user with username or email already exists
      const existingUser = await User.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.username} sudah ada, skip...`);
        continue;
      }

      const user = await User.create(userData);
      console.log(`✅ User ${userData.username} (${userData.fullName}) berhasil dibuat`);
    } catch (error) {
      console.error(`❌ Error membuat user ${userData.username}:`, error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  createDefaultUsers()
    .then(() => {
      console.log('\n🎉 Selesai! Anda sekarang bisa login dengan:');
      console.log('📋 PEMILIK:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('📋 PEGAWAI:');
      console.log('   Username: pegawai1 atau pegawai2');
      console.log('   Password: pegawai123');
      console.log('\n🌐 Frontend URL: http://localhost:9001');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createDefaultUsers };