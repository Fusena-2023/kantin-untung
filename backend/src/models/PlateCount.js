const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlateCount = sequelize.define('PlateCount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Tanggal pencatatan',
  },
  shift: {
    type: DataTypes.ENUM('siang', 'malam'),
    allowNull: false,
    comment: 'Shift siang atau malam',
  },
  plateCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'plate_count',
    validate: {
      min: 0,
    },
    comment: 'Jumlah piring yang dimakan',
  },
  // Harga konfigurasi (bisa di-override per record jika ada perubahan harga)
  pricePerPlate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price_per_plate',
    defaultValue: 11500,
    comment: 'Harga per piring dari pabrik (Rp 11.500)',
  },
  incomePerPlate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'income_per_plate',
    defaultValue: 7000,
    comment: 'Penghasilan per piring untuk kantin (Rp 7.000)',
  },
  returnPerPlate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'return_per_plate',
    defaultValue: 4500,
    comment: 'Dikembalikan ke pabrik per piring (Rp 4.500)',
  },
  taxPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'tax_percentage',
    defaultValue: 2.00,
    comment: 'Persentase pajak (2%)',
  },
  // Calculated fields (stored for reporting purposes)
  totalTransfer: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_transfer',
    defaultValue: 0,
    comment: 'Total transfer dari pabrik',
  },
  grossIncome: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'gross_income',
    defaultValue: 0,
    comment: 'Penghasilan kotor (sebelum pajak)',
  },
  incomeTax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'income_tax',
    defaultValue: 0,
    comment: 'Pajak dari penghasilan',
  },
  netIncome: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'net_income',
    defaultValue: 0,
    comment: 'Penghasilan bersih (setelah pajak)',
  },
  grossReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'gross_return',
    defaultValue: 0,
    comment: 'Pengembalian kotor (sebelum pajak)',
  },
  returnTax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'return_tax',
    defaultValue: 0,
    comment: 'Pajak dari pengembalian',
  },
  netReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'net_return',
    defaultValue: 0,
    comment: 'Pengembalian bersih (setelah pajak)',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Catatan tambahan',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'plate_counts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['date'] },
    { fields: ['shift'] },
    { fields: ['user_id'] },
    { fields: ['date', 'shift'], unique: true }, // Unique per tanggal dan shift
  ],
  hooks: {
    beforeValidate: (plateCount) => {
      // Calculate all values before saving
      const count = parseInt(plateCount.plateCount) || 0;
      const pricePerPlate = parseFloat(plateCount.pricePerPlate) || 11500;
      const incomePerPlate = parseFloat(plateCount.incomePerPlate) || 7000;
      const returnPerPlate = parseFloat(plateCount.returnPerPlate) || 4500;
      const taxPercentage = parseFloat(plateCount.taxPercentage) || 2;

      // Total transfer dari pabrik
      plateCount.totalTransfer = count * pricePerPlate;

      // Penghasilan
      plateCount.grossIncome = count * incomePerPlate;
      plateCount.incomeTax = plateCount.grossIncome * (taxPercentage / 100);
      plateCount.netIncome = plateCount.grossIncome - plateCount.incomeTax;

      // Pengembalian
      plateCount.grossReturn = count * returnPerPlate;
      plateCount.returnTax = plateCount.grossReturn * (taxPercentage / 100);
      plateCount.netReturn = plateCount.grossReturn - plateCount.returnTax;
    },
  },
});

module.exports = PlateCount;
