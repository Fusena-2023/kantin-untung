const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan, akses ditolak'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: 'userRole',
          attributes: ['id', 'name', 'displayName', 'permissions']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau user tidak aktif'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token telah kadaluwarsa'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error pada server'
    });
  }
};

const authorize = (...roleIds) => {
  return (req, res, next) => {
    const userRoleId = req.user.userRole?.id || req.user.roleId
    if (!roleIds.includes(userRoleId)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak, role tidak sesuai'
      });
    }
    next();
  };
};

const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.userRole ? user.userRole.name : (user.role === 1 ? 'pemilik' : 'pegawai'),
    fullName: user.fullName,
    email: user.email
  };
  
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

module.exports = {
  authenticate,
  authorize,
  generateToken,
};