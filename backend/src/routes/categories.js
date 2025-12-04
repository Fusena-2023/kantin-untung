const express = require('express');
const { Category } = require('../models');

const router = express.Router();

// Get all categories or by type (masuk/keluar)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    let whereCondition = { isActive: true };
    
    if (type && ['masuk', 'keluar'].includes(type)) {
      whereCondition.type = type;
    }

    const categories = await Category.findAll({
      where: whereCondition,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'type', 'icon', 'color', 'description']
    });

    res.json({
      success: true,
      message: type ? `Kategori ${type} berhasil diambil` : 'Semua kategori berhasil diambil',
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kategori'
    });
  }
});

// Get categories by type (masuk/keluar) - parameter route
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['masuk', 'keluar'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type harus masuk atau keluar'
      });
    }

    const categories = await Category.findAll({
      where: {
        type: type,
        isActive: true
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'type', 'icon', 'color', 'description']
    });

    res.json({
      success: true,
      message: `Kategori ${type} berhasil diambil`,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kategori'
    });
  }
});

module.exports = router;