const express = require('express');
const bcrypt = require('bcryptjs');
const { body, param, validationResult } = require('express-validator');
const { User, Role } = require('../models');
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

// Get all users (pemilik only)
router.get('/', authorize(1), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role } = req.query;
    const offset = (page - 1) * limit;

    const whereCondition = {};
    
    if (search) {
      whereCondition[require('sequelize').Op.or] = [
        { username: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { fullName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    if (role && ['1', '2'].includes(role)) {
      whereCondition.role = parseInt(role);
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Role,
          as: 'userRole',
          attributes: ['id', 'name', 'displayName']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Data user berhasil diambil',
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user'
    });
  }
});

// Get user by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Format ID tidak valid')
], validateInput, authorize(1), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          as: 'userRole',
          attributes: ['id', 'name', 'displayName']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data user berhasil diambil',
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user'
    });
  }
});

// Create user (pemilik only)
router.post('/', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus 3-50 karakter')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username hanya boleh huruf, angka, dan underscore'),
  body('email')
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama lengkap harus 2-100 karakter'),
  body('role')
    .isInt({ min: 1, max: 2 })
    .withMessage('Role harus 1 (pemilik) atau 2 (pegawai)'),
], validateInput, authorize(1), async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username atau email sudah digunakan'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: { user }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat user'
    });
  }
});

// Update user - full update (pemilik only)
router.put('/:id', [
  param('id').isUUID().withMessage('Format ID tidak valid'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus 3-50 karakter'),
  body('email')
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama lengkap harus 2-100 karakter'),
  body('role')
    .isInt({ min: 1, max: 2 })
    .withMessage('Role harus 1 (pemilik) atau 2 (pegawai)'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive harus boolean'),
], validateInput, authorize(1), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Check if username/email already exists
    if (updateData.username || updateData.email) {
      const whereCondition = {
        id: { [require('sequelize').Op.ne]: id }
      };
      
      if (updateData.username && updateData.email) {
        whereCondition[require('sequelize').Op.or] = [
          { username: updateData.username },
          { email: updateData.email }
        ];
      } else if (updateData.username) {
        whereCondition.username = updateData.username;
      } else {
        whereCondition.email = updateData.email;
      }

      const existingUser = await User.findOne({ where: whereCondition });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username atau email sudah digunakan'
        });
      }
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: 'User berhasil diupdate',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate user'
    });
  }
});

// Delete user (pemilik only)
router.delete('/:id', [
  param('id').isUUID().withMessage('Format ID tidak valid')
], validateInput, authorize(1), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus user'
    });
  }
});

// Update user - partial update (pemilik only)
router.patch('/:id', [
  param('id').isUUID().withMessage('Format ID tidak valid'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus 3-50 karakter'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama lengkap harus 2-100 karakter'),
  body('role')
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage('Role harus 1 (pemilik) atau 2 (pegawai)'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter'),
], validateInput, authorize(1), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'roleData',
        attributes: ['id', 'name']
      }],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'User berhasil diupdate',
      data: { user: updatedUser }
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path === 'username' ? 'Username' : 'Email';
      return res.status(400).json({
        success: false,
        message: `${field} sudah digunakan`
      });
    }

    console.error('Patch user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate user'
    });
  }
});

module.exports = router;