const { sequelize, User, Transaction, Role, Category, Branch } = require('./models');
const { createDefaultBranches } = require('./seeders/createBranches');

async function initializeDatabase() {
  try {
    console.log('🔄 Memulai inisialisasi database...');
    
    // Sync database - drop and recreate tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized');

    // Create branches first
    await createDefaultBranches();

    // Seed roles
    console.log('🔄 Creating roles...');
    await Role.bulkCreate([
      {
        id: 1,
        name: 'pemilik',
        displayName: 'Pemilik',
        description: 'Owner/Administrator dengan akses penuh',
        permissions: [
          'view_dashboard',
          'manage_users',
          'view_all_transactions',
          'edit_transactions',
          'delete_transactions',
          'view_reports',
          'manage_system'
        ],
        isActive: true
      },
      {
        id: 2,
        name: 'pegawai',
        displayName: 'Pegawai',
        description: 'Employee dengan akses terbatas',
        permissions: [
          'view_dashboard',
          'create_transactions',
          'view_own_transactions',
          'edit_own_transactions'
        ],
        isActive: true
      }
    ]);
    console.log('✅ Roles created successfully');

    // Seed categories
    console.log('🔄 Creating categories...');
    await Category.bulkCreate([
      // Categories for PEMASUKAN (income)
      { id: 1, name: 'Uang Siang', type: 'masuk', icon: 'wb_sunny', color: 'orange', sortOrder: 1 },
      { id: 2, name: 'Uang Sore', type: 'masuk', icon: 'brightness_6', color: 'deep-orange', sortOrder: 2 },
      { id: 3, name: 'Uang Malam', type: 'masuk', icon: 'nights_stay', color: 'indigo', sortOrder: 3 },
      { id: 4, name: 'Uang Catering', type: 'masuk', icon: 'restaurant_menu', color: 'purple', sortOrder: 4 },
      { id: 5, name: 'Pemasukan Lainnya', type: 'masuk', icon: 'more_horiz', color: 'grey', sortOrder: 99 },

      // Categories for PENGELUARAN (expenses)  
      { id: 11, name: 'Bahan Baku', type: 'keluar', icon: 'inventory', color: 'negative', sortOrder: 1 },
      { id: 12, name: 'Gaji Pegawai', type: 'keluar', icon: 'people', color: 'red', sortOrder: 2 },
      { id: 13, name: 'Listrik & Air', type: 'keluar', icon: 'electrical_services', color: 'yellow', sortOrder: 3 },
      { id: 14, name: 'Gas LPG', type: 'keluar', icon: 'local_fire_department', color: 'orange', sortOrder: 4 },
      { id: 15, name: 'Peralatan Masak', type: 'keluar', icon: 'kitchen', color: 'brown', sortOrder: 5 },
      { id: 16, name: 'Maintenance', type: 'keluar', icon: 'build', color: 'teal', sortOrder: 6 },
      { id: 17, name: 'Transportasi', type: 'keluar', icon: 'local_shipping', color: 'indigo', sortOrder: 7 },
      { id: 18, name: 'Sewa Tempat', type: 'keluar', icon: 'home', color: 'deep-purple', sortOrder: 8 },
      { id: 19, name: 'Pajak & Admin', type: 'keluar', icon: 'receipt_long', color: 'grey-8', sortOrder: 9 },
      { id: 20, name: 'Pengeluaran Lainnya', type: 'keluar', icon: 'more_horiz', color: 'grey', sortOrder: 99 },
    ]);
    console.log('✅ Categories created successfully');

    // Seed default users with branches
    console.log('🔄 Creating default users...');
    
    // Get created branches
    const pabrikBranch = await Branch.findOne({ where: { code: 'PABRIK' } });
    const kantorBranch = await Branch.findOne({ where: { code: 'KANTOR' } });
    
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@kantinuntung.com',
        password: 'admin123',
        fullName: 'Administrator Super',
        role: 1, // pemilik
        branchId: null, // super admin - access all branches
        isActive: true
      },
      {
        username: 'manager_pabrik',
        email: 'manager.pabrik@kantinuntung.com',
        password: 'manager123',
        fullName: 'Manager Kantin Pabrik',
        role: 1, // pemilik
        branchId: pabrikBranch.id,
        isActive: true
      },
      {
        username: 'manager_kantor',
        email: 'manager.kantor@kantinuntung.com',
        password: 'manager123',
        fullName: 'Manager Kantin Kantor',
        role: 1, // pemilik
        branchId: kantorBranch.id,
        isActive: true
      },
      {
        username: 'pegawai_pabrik',
        email: 'pegawai.pabrik@kantinuntung.com',
        password: 'pegawai123',
        fullName: 'Pegawai Kantin Pabrik',
        role: 2, // pegawai
        branchId: pabrikBranch.id,
        isActive: true
      },
      {
        username: 'pegawai_kantor',
        email: 'pegawai.kantor@kantinuntung.com',
        password: 'pegawai123',
        fullName: 'Pegawai Kantin Kantor',
        role: 2, // pegawai
        branchId: kantorBranch.id,
        isActive: true
      }
    ];

    for (const userData of defaultUsers) {
      await User.create(userData);
      console.log(`✅ User ${userData.username} created`);
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('');
    console.log('📋 Default users:');
    console.log('   Super Admin      - username: admin           password: admin123   (All branches)');
    console.log('   Manager Pabrik   - username: manager_pabrik  password: manager123 (Pabrik only)');
    console.log('   Manager Kantor   - username: manager_kantor  password: manager123 (Kantor only)');
    console.log('   Pegawai Pabrik   - username: pegawai_pabrik  password: pegawai123 (Pabrik only)');
    console.log('   Pegawai Kantor   - username: pegawai_kantor  password: pegawai123 (Kantor only)');
    console.log('');
    console.log('🏢 Branches:');
    console.log('   PABRIK - Kantin Pabrik (06:00-18:00)');
    console.log('   KANTOR - Kantin Kantor (07:00-17:00)');
    console.log('');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ All done! Database ready to use.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to initialize database:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };