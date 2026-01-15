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
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['shift1', 'shift2', 'tambahan_s1', 'tambahan_s2']],
    },
    comment: 'Shift: shift1, shift2, tambahan_s1, tambahan_s2',
  },
  
  // Jumlah piring per sumber
  sgpCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sgp_count',
    validate: { min: 0 },
    comment: 'Jumlah piring SGP',
  },
  hiroseCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'hirose_count',
    validate: { min: 0 },
    comment: 'Jumlah piring Hirose',
  },
  
  // Harga konfigurasi (bisa di-override per record jika ada perubahan harga)
  pricePerPlate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price_per_plate',
    defaultValue: 9500,
    comment: 'Harga per piring dari pabrik (Rp 9.500)',
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
    defaultValue: 2500,
    comment: 'Dikembalikan ke pabrik per piring (Rp 2.500)',
  },
  taxPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'tax_percentage',
    defaultValue: 2.00,
    comment: 'Persentase pajak (2%)',
  },
  
  // Total combined
  totalPlates: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_plates',
    comment: 'Total piring (SGP + Hirose)',
  },
  totalTransfer: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_transfer',
    defaultValue: 0,
    comment: 'Total transfer dari pabrik',
  },
  
  // SGP calculated fields
  sgpGrossIncome: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'sgp_gross_income',
    defaultValue: 0,
  },
  sgpIncomeTax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'sgp_income_tax',
    defaultValue: 0,
  },
  sgpNetIncome: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'sgp_net_income',
    defaultValue: 0,
  },
  sgpGrossReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'sgp_gross_return',
    defaultValue: 0,
  },
  sgpReturnTax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'sgp_return_tax',
    defaultValue: 0,
  },
  sgpNetReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'sgp_net_return',
    defaultValue: 0,
  },
  
  // Hirose calculated fields
  hiroseGrossIncome: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'hirose_gross_income',
    defaultValue: 0,
  },
  hiroseIncomeTax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'hirose_income_tax',
    defaultValue: 0,
  },
  hiroseNetIncome: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'hirose_net_income',
    defaultValue: 0,
  },
  hiroseGrossReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'hirose_gross_return',
    defaultValue: 0,
  },
  hiroseReturnTax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'hirose_return_tax',
    defaultValue: 0,
  },
  hiroseNetReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'hirose_net_return',
    defaultValue: 0,
  },
  
  // Combined totals
  totalGrossIncome: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_gross_income',
    defaultValue: 0,
  },
  totalIncomeTax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_income_tax',
    defaultValue: 0,
  },
  totalNetIncome: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_net_income',
    defaultValue: 0,
  },
  totalGrossReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_gross_return',
    defaultValue: 0,
  },
  totalReturnTax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_return_tax',
    defaultValue: 0,
  },
  totalNetReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_net_return',
    defaultValue: 0,
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
    { fields: ['date', 'shift'], unique: true },
  ],
  hooks: {
    beforeValidate: (plateCount) => {
      calculateFields(plateCount);
    },
    beforeUpdate: (plateCount) => {
      calculateFields(plateCount);
    },
  },
});

// Helper function for calculation
function calculateFields(plateCount) {
  const sgpCount = parseInt(plateCount.sgpCount) || 0;
  const hiroseCount = parseInt(plateCount.hiroseCount) || 0;
  const pricePerPlate = parseFloat(plateCount.pricePerPlate) || 9500;
  const incomePerPlate = parseFloat(plateCount.incomePerPlate) || 7000;
  const returnPerPlate = parseFloat(plateCount.returnPerPlate) || 2500;
  const taxPercentage = parseFloat(plateCount.taxPercentage) || 2;
  
  // Total plates
  plateCount.totalPlates = sgpCount + hiroseCount;
  plateCount.totalTransfer = plateCount.totalPlates * pricePerPlate;
  
  // SGP calculations
  plateCount.sgpGrossIncome = sgpCount * incomePerPlate;
  plateCount.sgpIncomeTax = plateCount.sgpGrossIncome * (taxPercentage / 100);
  plateCount.sgpNetIncome = plateCount.sgpGrossIncome - plateCount.sgpIncomeTax;
  plateCount.sgpGrossReturn = sgpCount * returnPerPlate;
  plateCount.sgpReturnTax = plateCount.sgpGrossReturn * (taxPercentage / 100);
  plateCount.sgpNetReturn = plateCount.sgpGrossReturn - plateCount.sgpReturnTax;
  
  // Hirose calculations
  plateCount.hiroseGrossIncome = hiroseCount * incomePerPlate;
  plateCount.hiroseIncomeTax = plateCount.hiroseGrossIncome * (taxPercentage / 100);
  plateCount.hiroseNetIncome = plateCount.hiroseGrossIncome - plateCount.hiroseIncomeTax;
  plateCount.hiroseGrossReturn = hiroseCount * returnPerPlate;
  plateCount.hiroseReturnTax = plateCount.hiroseGrossReturn * (taxPercentage / 100);
  plateCount.hiroseNetReturn = plateCount.hiroseGrossReturn - plateCount.hiroseReturnTax;
  
  // Combined totals
  plateCount.totalGrossIncome = plateCount.sgpGrossIncome + plateCount.hiroseGrossIncome;
  plateCount.totalIncomeTax = plateCount.sgpIncomeTax + plateCount.hiroseIncomeTax;
  plateCount.totalNetIncome = plateCount.sgpNetIncome + plateCount.hiroseNetIncome;
  plateCount.totalGrossReturn = plateCount.sgpGrossReturn + plateCount.hiroseGrossReturn;
  plateCount.totalReturnTax = plateCount.sgpReturnTax + plateCount.hiroseReturnTax;
  plateCount.totalNetReturn = plateCount.sgpNetReturn + plateCount.hiroseNetReturn;
}

module.exports = PlateCount;
