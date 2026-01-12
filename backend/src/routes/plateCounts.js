const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const PlateCount = require('../models/PlateCount');
const { authorize } = require('../middleware/auth');

// Get all plate counts dengan filter (hanya pemilik yang bisa lihat semua)
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, shift, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    
    // Filter by date range
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: endDate
      };
    }
    
    // Filter by shift
    if (shift && ['siang', 'malam'].includes(shift)) {
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
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    
    const where = {};
    
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
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
      totalPlates: 0,
      totalTransfer: 0,
      grossIncome: 0,
      incomeTax: 0,
      netIncome: 0,
      grossReturn: 0,
      returnTax: 0,
      netReturn: 0,
      totalTax: 0,
      recordCount: records.length,
      dailyBreakdown: {}
    };
    
    records.forEach(record => {
      summary.totalPlates += parseInt(record.plateCount);
      summary.totalTransfer += parseFloat(record.totalTransfer);
      summary.grossIncome += parseFloat(record.grossIncome);
      summary.incomeTax += parseFloat(record.incomeTax);
      summary.netIncome += parseFloat(record.netIncome);
      summary.grossReturn += parseFloat(record.grossReturn);
      summary.returnTax += parseFloat(record.returnTax);
      summary.netReturn += parseFloat(record.netReturn);
      
      // Group by date for daily breakdown
      const dateKey = record.date;
      if (!summary.dailyBreakdown[dateKey]) {
        summary.dailyBreakdown[dateKey] = {
          date: dateKey,
          shifts: {},
          totalPlates: 0,
          totalTransfer: 0,
          grossIncome: 0,
          netIncome: 0,
          grossReturn: 0,
          netReturn: 0,
          totalTax: 0
        };
      }
      
      summary.dailyBreakdown[dateKey].shifts[record.shift] = {
        plateCount: parseInt(record.plateCount),
        totalTransfer: parseFloat(record.totalTransfer),
        grossIncome: parseFloat(record.grossIncome),
        netIncome: parseFloat(record.netIncome),
        grossReturn: parseFloat(record.grossReturn),
        netReturn: parseFloat(record.netReturn)
      };
      
      summary.dailyBreakdown[dateKey].totalPlates += parseInt(record.plateCount);
      summary.dailyBreakdown[dateKey].totalTransfer += parseFloat(record.totalTransfer);
      summary.dailyBreakdown[dateKey].grossIncome += parseFloat(record.grossIncome);
      summary.dailyBreakdown[dateKey].netIncome += parseFloat(record.netIncome);
      summary.dailyBreakdown[dateKey].grossReturn += parseFloat(record.grossReturn);
      summary.dailyBreakdown[dateKey].netReturn += parseFloat(record.netReturn);
      summary.dailyBreakdown[dateKey].totalTax += parseFloat(record.incomeTax) + parseFloat(record.returnTax);
    });
    
    summary.totalTax = summary.incomeTax + summary.returnTax;
    
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

// Get today's summary (quick view) - MUST be before /:id route
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
        siang: null,
        malam: null
      },
      totalPlates: 0,
      totalTransfer: 0,
      grossIncome: 0,
      netIncome: 0,
      grossReturn: 0,
      netReturn: 0,
      totalTax: 0
    };
    
    records.forEach(record => {
      summary.shifts[record.shift] = {
        id: record.id,
        plateCount: parseInt(record.plateCount),
        totalTransfer: parseFloat(record.totalTransfer),
        grossIncome: parseFloat(record.grossIncome),
        netIncome: parseFloat(record.netIncome),
        grossReturn: parseFloat(record.grossReturn),
        netReturn: parseFloat(record.netReturn)
      };
      
      summary.totalPlates += parseInt(record.plateCount);
      summary.totalTransfer += parseFloat(record.totalTransfer);
      summary.grossIncome += parseFloat(record.grossIncome);
      summary.netIncome += parseFloat(record.netIncome);
      summary.grossReturn += parseFloat(record.grossReturn);
      summary.netReturn += parseFloat(record.netReturn);
      summary.totalTax += parseFloat(record.incomeTax) + parseFloat(record.returnTax);
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
      plateCount: count,
      pricePerPlate = 11500,
      incomePerPlate = 7000,
      returnPerPlate = 4500,
      taxPercentage = 2,
      notes 
    } = req.body;
    
    // Validation
    if (!date || !shift || count === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal, shift, dan jumlah piring wajib diisi'
      });
    }
    
    if (!['siang', 'malam'].includes(shift)) {
      return res.status(400).json({
        success: false,
        message: 'Shift harus siang atau malam'
      });
    }
    
    if (parseInt(count) < 0) {
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
        message: `Data untuk shift ${shift} tanggal ini sudah ada. Silakan edit data yang sudah ada.`
      });
    }
    
    const plateCountRecord = await PlateCount.create({
      date,
      shift,
      plateCount: parseInt(count),
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
      plateCount: count,
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
          message: `Data untuk shift ${shift || plateCount.shift} tanggal ini sudah ada.`
        });
      }
    }
    
    await plateCount.update({
      date: date || plateCount.date,
      shift: shift || plateCount.shift,
      plateCount: count !== undefined ? parseInt(count) : plateCount.plateCount,
      pricePerPlate: pricePerPlate || plateCount.pricePerPlate,
      incomePerPlate: incomePerPlate || plateCount.incomePerPlate,
      returnPerPlate: returnPerPlate || plateCount.returnPerPlate,
      taxPercentage: taxPercentage !== undefined ? taxPercentage : plateCount.taxPercentage,
      notes: notes !== undefined ? notes : plateCount.notes
    });
    
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
