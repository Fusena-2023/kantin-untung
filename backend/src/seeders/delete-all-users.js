const { User, Role } = require('../models');

async function deleteAllUsers() {
  try {
    console.log('⚠️  PERINGATAN: Script ini akan menghapus SEMUA user dari database!');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Tampilkan user yang akan dihapus
    const users = await User.findAll();
    if (users.length === 0) {
      console.log('ℹ️  Tidak ada user di database');
      rl.close();
      return;
    }

    console.log('\n👥 User yang akan dihapus:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.fullName})`);
    });

    const answer = await new Promise((resolve) => {
      rl.question('\nApakah Anda yakin ingin menghapus SEMUA user? Ketik "DELETE ALL" untuk konfirmasi: ', resolve);
    });
    
    rl.close();
    
    if (answer !== 'DELETE ALL') {
      console.log('❌ Proses dibatalkan. User tidak dihapus.');
      return;
    }

    // Hapus semua user
    const deletedCount = await User.destroy({
      where: {},
      truncate: true
    });

    console.log(`✅ Berhasil menghapus ${deletedCount} user dari database`);
    console.log('💡 Gunakan script create-default-users.js untuk membuat user baru');

  } catch (error) {
    console.error('❌ Error menghapus user:', error);
  }
}

// Run if called directly
if (require.main === module) {
  deleteAllUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { deleteAllUsers };