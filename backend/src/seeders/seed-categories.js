require('dotenv').config();
const Category = require('../models/Category');
const sequelize = require('../config/database');

const defaultCategories = [
    // Kategori Pemasukan
    { name: 'Uang Malam', type: 'masuk', description: 'Pendapatan shift malam', icon: 'nights_stay', color: 'positive', sortOrder: 1 },
    { name: 'Uang Siang', type: 'masuk', description: 'Pendapatan shift siang', icon: 'wb_sunny', color: 'positive', sortOrder: 2 },
    { name: 'Uang Sore', type: 'masuk', description: 'Pendapatan shift sore', icon: 'wb_twilight', color: 'positive', sortOrder: 3 },
    { name: 'Pendapatan Lain', type: 'masuk', description: 'Pendapatan lainnya', icon: 'attach_money', color: 'positive', sortOrder: 4 },

    // Kategori Pengeluaran
    { name: 'Belanja Bahan Baku', type: 'keluar', description: 'Pembelian bahan masakan', icon: 'shopping_cart', color: 'negative', sortOrder: 5 },
    { name: 'Belanja Minuman', type: 'keluar', description: 'Pembelian stok minuman', icon: 'liquor', color: 'negative', sortOrder: 6 },
    { name: 'Belanja Snack', type: 'keluar', description: 'Pembelian stok snack', icon: 'shopping_bag', color: 'negative', sortOrder: 7 },
    { name: 'Biaya Operasional', type: 'keluar', description: 'Listrik, gas, dll', icon: 'electric_bolt', color: 'warning', sortOrder: 8 },
    { name: 'Gaji Karyawan', type: 'keluar', description: 'Pembayaran gaji', icon: 'people', color: 'warning', sortOrder: 9 },
    { name: 'Biaya Sampah', type: 'keluar', description: 'Biaya pembuangan sampah', icon: 'delete', color: 'negative', sortOrder: 10 },
    { name: 'Pengeluaran Lain', type: 'keluar', description: 'Pengeluaran lainnya', icon: 'money_off', color: 'negative', sortOrder: 11 },
];

async function seedCategories() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Hapus kategori lama
        console.log('�️  Deleting old categories...');
        await Category.destroy({ where: {} });
        console.log('✅ Old categories deleted');

        console.log('�🔄 Seeding new categories...');

        for (const cat of defaultCategories) {
            const [category, created] = await Category.findOrCreate({
                where: { name: cat.name },
                defaults: cat
            });

            if (created) {
                console.log(`  ✅ Created: ${cat.name}`);
            } else {
                console.log(`  ⏭️  Exists: ${cat.name}`);
            }
        }

        console.log('\n🎉 Categories seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();
