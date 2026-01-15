const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const PlateCount = require('../models/PlateCount');
const { authorize } = require('../middleware/auth');

// Valid shifts
const VALID_SHIFTS = ['shift1', 'shift2', 'tambahan_s1', 'tambahan_s2'];

// Shift labels
const SHIFT_LABELS = {
  shift1: 'Shift 1',
  shift2: 'Shift 2',
  tambahan_s1: 'Tambahan S1',
  tambahan_s2: 'Tambahan S2'
};

// Get all plate counts dengan filter
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, shift, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    
    // Filter by date range
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }
    
    // Filter by shift
    if (shift && VALID_SHIFTS.includes(shift)) {
      where.shift = shift;
    }
    
    // Pegawai hanya bisa lihat data sendiri
    if (req.user.userRole?.name !== 'pemilik') {
      where.userId = req.user.id;
    }
    
    const { count, rows } = await PlateCount.findAndCountAll({
      where,
      order: [['date', 'DESC'], ['shift', 'ASC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get summary/report per periode
router.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    const where = {};
    
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }
    
    // Pegawai hanya bisa lihat data sendiri
    if (req.user.userRole?.name !== 'pemilik') {
      where.userId = req.user.id;
    }
    
    const records = await PlateCount.findAll({
      where,
      order: [['date', 'ASC'], ['shift', 'ASC']]
    });
    
    // Calculate totals
    const summary = {
      // Total combined
      totalPlates: 0,
      totalSgpCount: 0,
      totalHiroseCount: 0,
      totalTransfer: 0,
      
      // SGP totals
      sgpGrossIncome: 0,
      sgpIncomeTax: 0,
      sgpNetIncome: 0,
      sgpGrossReturn: 0,
      sgpReturnTax: 0,
      sgpNetReturn: 0,
      
      // Hirose totals
      hiroseGrossIncome: 0,
      hiroseIncomeTax: 0,
      hiroseNetIncome: 0,
      hiroseGrossReturn: 0,
      hiroseReturnTax: 0,
      hiroseNetReturn: 0,
      
      // Combined totals
      totalGrossIncome: 0,
      totalIncomeTax: 0,
      totalNetIncome: 0,
      totalGrossReturn: 0,
      totalReturnTax: 0,
      totalNetReturn: 0,
      totalTax: 0,
      
      recordCount: records.length,
      dailyBreakdown: {},
      byShift: {
        shift1: { sgpCount: 0, hiroseCount: 0, totalPlates: 0, totalNetIncome: 0, totalNetReturn: 0 },
        shift2: { sgpCount: 0, hiroseCount: 0, totalPlates: 0, totalNetIncome: 0, totalNetReturn: 0 },
        tambahan_s1: { sgpCount: 0, hiroseCount: 0, totalPlates: 0, totalNetIncome: 0, totalNetReturn: 0 },
        tambahan_s2: { sgpCount: 0, hiroseCount: 0, totalPlates: 0, totalNetIncome: 0, totalNetReturn: 0 }
      }
    };
    
    records.forEach(record => {
      // Accumulate totals
      summary.totalPlates += parseInt(record.totalPlates);
      summary.totalSgpCount += parseInt(record.sgpCount);
      summary.totalHiroseCount += parseInt(record.hiroseCount);
      summary.totalTransfer += parseFloat(record.totalTransfer);
      
      // SGP totals
      summary.sgpGrossIncome += parseFloat(record.sgpGrossIncome);
      summary.sgpIncomeTax += parseFloat(record.sgpIncomeTax);
      summary.sgpNetIncome += parseFloat(record.sgpNetIncome);
      summary.sgpGrossReturn += parseFloat(record.sgpGrossReturn);
      summary.sgpReturnTax += parseFloat(record.sgpReturnTax);
      summary.sgpNetReturn += parseFloat(record.sgpNetReturn);
      
      // Hirose totals
      summary.hiroseGrossIncome += parseFloat(record.hiroseGrossIncome);
      summary.hiroseIncomeTax += parseFloat(record.hiroseIncomeTax);
      summary.hiroseNetIncome += parseFloat(record.hiroseNetIncome);
      summary.hiroseGrossReturn += parseFloat(record.hiroseGrossReturn);
      summary.hiroseReturnTax += parseFloat(record.hiroseReturnTax);
      summary.hiroseNetReturn += parseFloat(record.hiroseNetReturn);
      
      // Combined totals
      summary.totalGrossIncome += parseFloat(record.totalGrossIncome);
      summary.totalIncomeTax += parseFloat(record.totalIncomeTax);
      summary.totalNetIncome += parseFloat(record.totalNetIncome);
      summary.totalGrossReturn += parseFloat(record.totalGrossReturn);
      summary.totalReturnTax += parseFloat(record.totalReturnTax);
      summary.totalNetReturn += parseFloat(record.totalNetReturn);
      
      // Aggregate by shift
      if (summary.byShift[record.shift]) {
        summary.byShift[record.shift].sgpCount += parseInt(record.sgpCount);
        summary.byShift[record.shift].hiroseCount += parseInt(record.hiroseCount);
        summary.byShift[record.shift].totalPlates += parseInt(record.totalPlates);
        summary.byShift[record.shift].totalNetIncome += parseFloat(record.totalNetIncome);
        summary.byShift[record.shift].totalNetReturn += parseFloat(record.totalNetReturn);
      }
      
      // Group by date for daily breakdown
      const dateKey = record.date;
      if (!summary.dailyBreakdown[dateKey]) {
        summary.dailyBreakdown[dateKey] = {
          date: dateKey,
          shifts: {},
          totalSgpCount: 0,
          totalHiroseCount: 0,
          totalPlates: 0,
          totalTransfer: 0,
          totalGrossIncome: 0,
          totalNetIncome: 0,
          totalGrossReturn: 0,
          totalNetReturn: 0,
          totalTax: 0
        };
      }
      
      summary.dailyBreakdown[dateKey].shifts[record.shift] = {
        sgpCount: parseInt(record.sgpCount),
        hiroseCount: parseInt(record.hiroseCount),
        totalPlates: parseInt(record.totalPlates),
        totalTransfer: parseFloat(record.totalTransfer),
        totalGrossIncome: parseFloat(record.totalGrossIncome),
        totalNetIncome: parseFloat(record.totalNetIncome),
        totalGrossReturn: parseFloat(record.totalGrossReturn),
        totalNetReturn: parseFloat(record.totalNetReturn)
      };
      
      summary.dailyBreakdown[dateKey].totalSgpCount += parseInt(record.sgpCount);
      summary.dailyBreakdown[dateKey].totalHiroseCount += parseInt(record.hiroseCount);
      summary.dailyBreakdown[dateKey].totalPlates += parseInt(record.totalPlates);
      summary.dailyBreakdown[dateKey].totalTransfer += parseFloat(record.totalTransfer);
      summary.dailyBreakdown[dateKey].totalGrossIncome += parseFloat(record.totalGrossIncome);
      summary.dailyBreakdown[dateKey].totalNetIncome += parseFloat(record.totalNetIncome);
      summary.dailyBreakdown[dateKey].totalGrossReturn += parseFloat(record.totalGrossReturn);
      summary.dailyBreakdown[dateKey].totalNetReturn += parseFloat(record.totalNetReturn);
      summary.dailyBreakdown[dateKey].totalTax += parseFloat(record.totalIncomeTax) + parseFloat(record.totalReturnTax);
    });
    
    summary.totalTax = summary.totalIncomeTax + summary.totalReturnTax;
    
    // Admin transfer bank: Rp 2.900 per minggu (Senin-Minggu)
    // Pabrik transfer setiap minggu (Senin-Minggu), dan langsung dikembalikan
    const ADMIN_FEE_PER_WEEK = 2900;
    
    // Hitung jumlah hari kerja (hari dengan data) dari dailyBreakdown
    const workingDaysCount = Object.keys(summary.dailyBreakdown).length;
    
    // Hitung jumlah minggu dari rentang tanggal (Senin-Minggu = 1 minggu = 1 transfer)
    let weekCount = 0;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      weekCount = Math.ceil(daysDiff / 7);
    } else if (workingDaysCount > 0) {
      weekCount = 1; // Default 1 minggu jika ada data tapi tidak ada filter
    }
    
    summary.workingDaysCount = workingDaysCount;
    summary.weekCount = weekCount;
    summary.adminFeePerWeek = ADMIN_FEE_PER_WEEK;
    summary.totalAdminFee = weekCount * ADMIN_FEE_PER_WEEK;
    
    // Final income after admin fee deduction
    summary.finalNetIncome = summary.totalNetIncome - summary.totalAdminFee;
    
    // Convert dailyBreakdown to array
    summary.dailyBreakdown = Object.values(summary.dailyBreakdown);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// Get today's summary - MUST be before /:id route
router.get('/today/summary', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const where = { date: today };
    
    if (req.user.userRole?.name !== 'pemilik') {
      where.userId = req.user.id;
    }
    
    const records = await PlateCount.findAll({ where });
    
    const summary = {
      date: today,
      shifts: {
        shift1: null,
        shift2: null,
        tambahan_s1: null,
        tambahan_s2: null
      },
      totalSgpCount: 0,
      totalHiroseCount: 0,
      totalPlates: 0,
      totalTransfer: 0,
      totalGrossIncome: 0,
      totalNetIncome: 0,
      totalGrossReturn: 0,
      totalNetReturn: 0,
      totalTax: 0
    };
    
    records.forEach(record => {
      summary.shifts[record.shift] = {
        id: record.id,
        sgpCount: parseInt(record.sgpCount),
        hiroseCount: parseInt(record.hiroseCount),
        totalPlates: parseInt(record.totalPlates),
        totalTransfer: parseFloat(record.totalTransfer),
        totalGrossIncome: parseFloat(record.totalGrossIncome),
        totalNetIncome: parseFloat(record.totalNetIncome),
        totalGrossReturn: parseFloat(record.totalGrossReturn),
        totalNetReturn: parseFloat(record.totalNetReturn)
      };
      
      summary.totalSgpCount += parseInt(record.sgpCount);
      summary.totalHiroseCount += parseInt(record.hiroseCount);
      summary.totalPlates += parseInt(record.totalPlates);
      summary.totalTransfer += parseFloat(record.totalTransfer);
      summary.totalGrossIncome += parseFloat(record.totalGrossIncome);
      summary.totalNetIncome += parseFloat(record.totalNetIncome);
      summary.totalGrossReturn += parseFloat(record.totalGrossReturn);
      summary.totalNetReturn += parseFloat(record.totalNetReturn);
      summary.totalTax += parseFloat(record.totalIncomeTax) + parseFloat(record.totalReturnTax);
    });
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// Get single plate count by ID
router.get('/:id', async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    
    // Pegawai hanya bisa lihat data sendiri
    if (req.user.userRole?.name !== 'pemilik') {
      where.userId = req.user.id;
    }
    
    const plateCount = await PlateCount.findOne({ where });
    
    if (!plateCount) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: plateCount
    });
  } catch (error) {
    next(error);
  }
});

// Create new plate count
router.post('/', async (req, res, next) => {
  try {
    const { 
      date, 
      shift, 
      sgpCount = 0,
      hiroseCount = 0,
      pricePerPlate = 11500,
      incomePerPlate = 7000,
      returnPerPlate = 4500,
      taxPercentage = 2,
      notes 
    } = req.body;
    
    // Validation
    if (!date || !shift) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal dan shift wajib diisi'
      });
    }
    
    if (!VALID_SHIFTS.includes(shift)) {
      return res.status(400).json({
        success: false,
        message: 'Shift harus: Shift 1, Shift 2, Tambahan S1, atau Tambahan S2'
      });
    }
    
    if (parseInt(sgpCount) < 0 || parseInt(hiroseCount) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah piring tidak boleh negatif'
      });
    }
    
    // Check if record already exists for this date and shift
    const existing = await PlateCount.findOne({
      where: { date, shift }
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Data untuk ${SHIFT_LABELS[shift]} tanggal ini sudah ada. Silakan edit data yang sudah ada.`
      });
    }
    
    const plateCountRecord = await PlateCount.create({
      date,
      shift,
      sgpCount: parseInt(sgpCount),
      hiroseCount: parseInt(hiroseCount),
      pricePerPlate,
      incomePerPlate,
      returnPerPlate,
      taxPercentage,
      notes,
      userId: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Data berhasil disimpan',
      data: plateCountRecord
    });
  } catch (error) {
    next(error);
  }
});

// Update plate count
router.put('/:id', async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    
    // Pegawai hanya bisa edit data sendiri
    if (req.user.userRole?.name !== 'pemilik') {
      where.userId = req.user.id;
    }
    
    const plateCount = await PlateCount.findOne({ where });
    
    if (!plateCount) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    const { 
      date, 
      shift, 
      sgpCount,
      hiroseCount,
      pricePerPlate,
      incomePerPlate,
      returnPerPlate,
      taxPercentage,
      notes 
    } = req.body;
    
    // Check for duplicate if date or shift changed
    if ((date && date !== plateCount.date) || (shift && shift !== plateCount.shift)) {
      const existing = await PlateCount.findOne({
        where: { 
          date: date || plateCount.date, 
          shift: shift || plateCount.shift,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Data untuk ${SHIFT_LABELS[shift || plateCount.shift]} tanggal ini sudah ada.`
        });
      }
    }
    
    // Update fields
    plateCount.date = date || plateCount.date;
    plateCount.shift = shift || plateCount.shift;
    plateCount.sgpCount = sgpCount !== undefined ? parseInt(sgpCount) : plateCount.sgpCount;
    plateCount.hiroseCount = hiroseCount !== undefined ? parseInt(hiroseCount) : plateCount.hiroseCount;
    plateCount.pricePerPlate = pricePerPlate || plateCount.pricePerPlate;
    plateCount.incomePerPlate = incomePerPlate || plateCount.incomePerPlate;
    plateCount.returnPerPlate = returnPerPlate || plateCount.returnPerPlate;
    plateCount.taxPercentage = taxPercentage !== undefined ? taxPercentage : plateCount.taxPercentage;
    plateCount.notes = notes !== undefined ? notes : plateCount.notes;
    
    // Manually recalculate all computed fields
    const sgp = parseInt(plateCount.sgpCount) || 0;
    const hirose = parseInt(plateCount.hiroseCount) || 0;
    const price = parseFloat(plateCount.pricePerPlate) || 9500;
    const income = parseFloat(plateCount.incomePerPlate) || 7000;
    const returnPP = parseFloat(plateCount.returnPerPlate) || 2500;
    const tax = parseFloat(plateCount.taxPercentage) || 2;
    
    // Total plates
    plateCount.totalPlates = sgp + hirose;
    plateCount.totalTransfer = plateCount.totalPlates * price;
    
    // SGP calculations
    plateCount.sgpGrossIncome = sgp * income;
    plateCount.sgpIncomeTax = plateCount.sgpGrossIncome * (tax / 100);
    plateCount.sgpNetIncome = plateCount.sgpGrossIncome - plateCount.sgpIncomeTax;
    plateCount.sgpGrossReturn = sgp * returnPP;
    plateCount.sgpReturnTax = plateCount.sgpGrossReturn * (tax / 100);
    plateCount.sgpNetReturn = plateCount.sgpGrossReturn - plateCount.sgpReturnTax;
    
    // Hirose calculations
    plateCount.hiroseGrossIncome = hirose * income;
    plateCount.hiroseIncomeTax = plateCount.hiroseGrossIncome * (tax / 100);
    plateCount.hiroseNetIncome = plateCount.hiroseGrossIncome - plateCount.hiroseIncomeTax;
    plateCount.hiroseGrossReturn = hirose * returnPP;
    plateCount.hiroseReturnTax = plateCount.hiroseGrossReturn * (tax / 100);
    plateCount.hiroseNetReturn = plateCount.hiroseGrossReturn - plateCount.hiroseReturnTax;
    
    // Combined totals
    plateCount.totalGrossIncome = plateCount.sgpGrossIncome + plateCount.hiroseGrossIncome;
    plateCount.totalIncomeTax = plateCount.sgpIncomeTax + plateCount.hiroseIncomeTax;
    plateCount.totalNetIncome = plateCount.sgpNetIncome + plateCount.hiroseNetIncome;
    plateCount.totalGrossReturn = plateCount.sgpGrossReturn + plateCount.hiroseGrossReturn;
    plateCount.totalReturnTax = plateCount.sgpReturnTax + plateCount.hiroseReturnTax;
    plateCount.totalNetReturn = plateCount.sgpNetReturn + plateCount.hiroseNetReturn;
    
    await plateCount.save();
    
    res.json({
      success: true,
      message: 'Data berhasil diperbarui',
      data: plateCount
    });
  } catch (error) {
    next(error);
  }
});

// Delete plate count (hanya pemilik - role ID 1)
router.delete('/:id', authorize(1), async (req, res, next) => {
  try {
    const plateCount = await PlateCount.findByPk(req.params.id);
    
    if (!plateCount) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    await plateCount.destroy();
    
    res.json({
      success: true,
      message: 'Data berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
