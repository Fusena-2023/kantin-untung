const { User, Role } = require('../models');

async function listAllUsers() {
  try {
    console.log('👥 Daftar semua user di database:\n');

    const users = await User.findAll({
      include: [
        {
          model: Role,
          as: 'userRole',
          attributes: ['id', 'name', 'displayName']
        }
      ],
      order: [['role', 'ASC'], ['username', 'ASC']]
    });

    if (users.length === 0) {
      console.log('❌ Tidak ada user di database');
      return;
    }

    users.forEach((user, index) => {
      const roleInfo = user.userRole ? `${user.userRole.displayName} (${user.userRole.name})` : 'No role';
      const status = user.isActive ? '🟢 Aktif' : '🔴 Nonaktif';
      
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Nama: ${user.fullName}`);
      console.log(`   🏷️  Role: ${roleInfo}`);
      console.log(`   📊 Status: ${status}`);
      
      if (user.createdAt) {
        console.log(`   🕒 Dibuat: ${new Date(user.createdAt).toLocaleString('id-ID')}`);
      }
      if (user.lastLogin) {
        console.log(`   🔐 Login terakhir: ${new Date(user.lastLogin).toLocaleString('id-ID')}`);
      }
      console.log('');
    });

    console.log(`📊 Total user: ${users.length}`);
    console.log('\n🔑 Default passwords:');
    console.log('   - Pemilik (admin): admin123');
    console.log('   - Pegawai: pegawai123');
    console.log('\n🌐 Login di: http://localhost:9001/#/login');

  } catch (error) {
    console.error('❌ Error mengambil data user:', error);
  }
}

// Run if called directly
if (require.main === module) {
  listAllUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { listAllUsers };