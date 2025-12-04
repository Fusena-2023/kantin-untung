const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(error => error.message).join(', ');
    return res.status(400).json({
      success: false,
      message: 'Data tidak valid',
      errors: message
    });
  }

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return res.status(400).json({
      success: false,
      message: `${field} sudah digunakan`
    });
  }

  // Sequelize Foreign Key Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referensi data tidak valid'
    });
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid'
    });
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token telah kadaluwarsa'
    });
  }

  // Cast Error (Invalid ID format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Format ID tidak valid'
    });
  }

  // Default server error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Terjadi kesalahan pada server'
  });
};

module.exports = errorHandler;