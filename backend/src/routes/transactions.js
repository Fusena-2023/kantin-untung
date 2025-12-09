const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Transaction, User } = require('../models');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Data input tidak valid',
      errors: errors.array()
    });
  }
  next();
};

// Get transactions
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page harus integer positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit harus 1-100'),
  query('type').optional().isIn(['masuk', 'keluar']).withMessage('Type harus masuk atau keluar'),
  query('startDate').optional().isISO8601().withMessage('Format tanggal tidak valid'),
  query('endDate').optional().isISO8601().withMessage('Format tanggal tidak valid'),
], validateInput, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      category, 
      startDate, 
      endDate, 
      search = '' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereCondition = {};

    // Role-based filtering
    if (req.user.role === 'pegawai') {
      whereCondition.userId = req.user.id;
    }

    if (type) {
      whereCondition.type = type;
    }

    if (category) {
      whereCondition.category = { [require('sequelize').Op.iLike]: `%${category}%` };
    }

    if (startDate || endDate) {
      whereCondition.transactionDate = {};
      if (startDate) {
        whereCondition.transactionDate[require('sequelize').Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereCondition.transactionDate[require('sequelize').Op.lte] = new Date(endDate);
      }
    }

    if (search) {
      whereCondition[require('sequelize').Op.or] = [
        { description: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { category: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { notes: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'role']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['transactionDate', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      message: 'Data transaksi berhasil diambil',
      data: {
        transactions: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data transaksi'
    });
  }
});

// Get transaction by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Format ID tidak valid')
], validateInput, async (req, res) => {
  try {
    const whereCondition = { id: req.params.id };

    // Role-based filtering
    if (req.user.role === 'pegawai') {
      whereCondition.userId = req.user.id;
    }

    const transaction = await Transaction.findOne({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'role']
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data transaksi berhasil diambil',
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data transaksi'
    });
  }
});

// Create transaction
router.post('/', [
  body('type')
    .isIn(['masuk', 'keluar'])
    .withMessage('Type harus masuk atau keluar'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount harus lebih dari 0'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Deskripsi harus 1-500 karakter'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Kategori harus 1-100 karakter'),
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes maksimal 1000 karakter'),
], validateInput, async (req, res) => {
  try {
    const { type, amount, description, category, transactionDate, notes } = req.body;

    const transaction = await Transaction.create({
      type,
      amount,
      description,
      category,
      transactionDate: transactionDate || new Date(),
      notes,
      userId: req.user.id
    });

    const newTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'role']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dibuat',
      data: { transaction: newTransaction }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi'
    });
  }
});

// Update transaction (full update)
router.put('/:id', [
  param('id').isUUID().withMessage('Format ID tidak valid'),
  body('type')
    .isIn(['masuk', 'keluar'])
    .withMessage('Type harus masuk atau keluar'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount harus lebih dari 0'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Deskripsi harus 1-500 karakter'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Kategori harus 1-100 karakter'),
  body('transactionDate')
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes maksimal 1000 karakter'),
], validateInput, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const whereCondition = { id };

    // Only pemilik can edit any transaction, pegawai can only edit their own
    if (req.user.role === 'pegawai') {
      whereCondition.userId = req.user.id;
    }

    const transaction = await Transaction.findOne({ where: whereCondition });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan atau tidak memiliki akses'
      });
    }

    await transaction.update(updateData);

    const updatedTransaction = await Transaction.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Transaksi berhasil diupdate',
      data: { transaction: updatedTransaction }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate transaksi'
    });
  }
});

// Delete transaction (pemilik only)
router.delete('/:id', [
  param('id').isUUID().withMessage('Format ID tidak valid')
], validateInput, authorize(1), async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    await transaction.destroy();

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus transaksi'
    });
  }
});

// Update transaction (partial update)
router.patch('/:id', [
  param('id').isUUID().withMessage('Format ID tidak valid'),
  body('type')
    .optional()
    .isIn(['masuk', 'keluar'])
    .withMessage('Type harus masuk atau keluar'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount harus lebih dari 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Deskripsi harus 1-500 karakter'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Kategori harus 1-100 karakter'),
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes maksimal 1000 karakter'),
], validateInput, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const whereCondition = { id };

    // Only pemilik can edit any transaction, pegawai can only edit their own
    if (req.user.role === 'pegawai') {
      whereCondition.userId = req.user.id;
    }

    const transaction = await Transaction.findOne({ where: whereCondition });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan atau tidak memiliki akses'
      });
    }

    await transaction.update(updateData);

    const updatedTransaction = await Transaction.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Transaksi berhasil diupdate',
      data: { transaction: updatedTransaction }
    });
  } catch (error) {
    console.error('Patch transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate transaksi'
    });
  }
});

module.exports = router;