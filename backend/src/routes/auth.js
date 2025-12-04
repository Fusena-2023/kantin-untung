const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Role } = require('../models');
const { generateToken } = require('../middleware/auth');

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

// Register
router.post('/register', [
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
], validateInput, async (req, res) => {
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

    // Get user with role for token generation
    const userWithRole = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'userRole',
          attributes: ['id', 'name', 'displayName']
        }
      ]
    });

    const token = generateToken(userWithRole);

    res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendaftarkan user'
    });
  }
});

// Login
router.post('/login', [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username diperlukan'),
  body('password')
    .notEmpty()
    .withMessage('Password diperlukan'),
], validateInput, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ 
      where: { username },
      include: [
        {
          model: Role,
          as: 'userRole',
          attributes: ['id', 'name', 'displayName', 'permissions']
        }
      ],
      attributes: { include: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toJSON();

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal melakukan login'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout berhasil'
  });
});

module.exports = router;