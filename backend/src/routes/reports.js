const express = require('express');
const { query, validationResult } = require('express-validator');
const { Transaction, User } = require('../models');
const { authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

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

// Dashboard summary (pemilik only)
router.get('/dashboard', authorize(1), async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Today's summary
    const todayTransactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    // This month's summary
    const monthTransactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    // Calculate totals
    const todayIncome = todayTransactions
      .filter(t => t.type === 'masuk')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const todayExpense = todayTransactions
      .filter(t => t.type === 'keluar')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthIncome = monthTransactions
      .filter(t => t.type === 'masuk')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthExpense = monthTransactions
      .filter(t => t.type === 'keluar')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Total users
    const totalUsers = await User.count();
    const totalActiveUsers = await User.count({ where: { isActive: true } });

    // Recent transactions
    const recentTransactions = await Transaction.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName']
      }]
    });

    // Last 7 days data for chart
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const dayTransactions = await Transaction.findAll({
        where: {
          transactionDate: {
            [Op.between]: [dayStart, dayEnd]
          }
        }
      });

      const dayIncome = dayTransactions
        .filter(t => t.type === 'masuk')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const dayExpense = dayTransactions
        .filter(t => t.type === 'keluar')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      last7Days.push({
        date: dayStart.toISOString().split('T')[0],
        income: dayIncome,
        expense: dayExpense,
        profit: dayIncome - dayExpense,
        count: dayTransactions.length
      });
    }

    // Category breakdown for this month
    const categoryBreakdown = monthTransactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = {
          category: transaction.category,
          income: 0,
          expense: 0,
          count: 0
        };
      }
      
      if (transaction.type === 'masuk') {
        acc[transaction.category].income += parseFloat(transaction.amount);
      } else {
        acc[transaction.category].expense += parseFloat(transaction.amount);
      }
      acc[transaction.category].count += 1;
      
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Dashboard data berhasil diambil',
      data: {
        today: {
          income: todayIncome,
          expense: todayExpense,
          profit: todayIncome - todayExpense,
          transactions: todayTransactions.length
        },
        thisMonth: {
          income: monthIncome,
          expense: monthExpense,
          profit: monthIncome - monthExpense,
          transactions: monthTransactions.length
        },
        users: {
          total: totalUsers,
          active: totalActiveUsers
        },
        recentTransactions,
        dailyData: last7Days,
        byCategory: Object.values(categoryBreakdown).sort((a, b) => 
          (b.income + b.expense) - (a.income + a.expense)
        ).slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dashboard'
    });
  }
});

// Daily report
router.get('/daily', [
  query('date').optional().isISO8601().withMessage('Format tanggal tidak valid')
], validateInput, authorize(1), async (req, res) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const transactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName']
      }],
      order: [['transactionDate', 'ASC']]
    });

    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'masuk') {
        acc.totalIncome += parseFloat(transaction.amount);
        acc.incomeCount += 1;
      } else {
        acc.totalExpense += parseFloat(transaction.amount);
        acc.expenseCount += 1;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      incomeCount: 0,
      expenseCount: 0
    });

    summary.profit = summary.totalIncome - summary.totalExpense;
    summary.totalTransactions = transactions.length;

    // Group by category
    const byCategory = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = {
          category: transaction.category,
          income: 0,
          expense: 0,
          count: 0
        };
      }
      
      if (transaction.type === 'masuk') {
        acc[transaction.category].income += parseFloat(transaction.amount);
      } else {
        acc[transaction.category].expense += parseFloat(transaction.amount);
      }
      acc[transaction.category].count += 1;
      
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Laporan harian berhasil diambil',
      data: {
        date: targetDate.toISOString().split('T')[0],
        summary,
        transactions,
        byCategory: Object.values(byCategory)
      }
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan harian'
    });
  }
});

// Monthly report
router.get('/monthly', [
  query('year').optional().isInt({ min: 2000, max: 3000 }).withMessage('Tahun tidak valid'),
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Bulan tidak valid')
], validateInput, authorize(1), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const transactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName']
      }],
      order: [['transactionDate', 'ASC']]
    });

    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'masuk') {
        acc.totalIncome += parseFloat(transaction.amount);
        acc.incomeCount += 1;
      } else {
        acc.totalExpense += parseFloat(transaction.amount);
        acc.expenseCount += 1;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      incomeCount: 0,
      expenseCount: 0
    });

    summary.profit = summary.totalIncome - summary.totalExpense;
    summary.totalTransactions = transactions.length;

    // Group by date
    const dailyData = {};
    const daysInMonth = endOfMonth.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      dailyData[dateKey] = {
        date: dateKey,
        income: 0,
        expense: 0,
        profit: 0,
        count: 0
      };
    }

    transactions.forEach(transaction => {
      const dateKey = transaction.transactionDate.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        if (transaction.type === 'masuk') {
          dailyData[dateKey].income += parseFloat(transaction.amount);
        } else {
          dailyData[dateKey].expense += parseFloat(transaction.amount);
        }
        dailyData[dateKey].count += 1;
      }
    });

    // Calculate profit for each day
    Object.values(dailyData).forEach(day => {
      day.profit = day.income - day.expense;
    });

    // Group by category
    const byCategory = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = {
          category: transaction.category,
          income: 0,
          expense: 0,
          count: 0
        };
      }
      
      if (transaction.type === 'masuk') {
        acc[transaction.category].income += parseFloat(transaction.amount);
      } else {
        acc[transaction.category].expense += parseFloat(transaction.amount);
      }
      acc[transaction.category].count += 1;
      
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Laporan bulanan berhasil diambil',
      data: {
        year,
        month,
        summary,
        dailyData: Object.values(dailyData),
        byCategory: Object.values(byCategory),
        totalDays: daysInMonth
      }
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan bulanan'
    });
  }
});

// Custom date range report
router.get('/range', [
  query('startDate').isISO8601().withMessage('Format tanggal mulai tidak valid'),
  query('endDate').isISO8601().withMessage('Format tanggal akhir tidak valid')
], validateInput, authorize(1), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal mulai harus lebih kecil dari tanggal akhir'
      });
    }

    const transactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [start, end]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName']
      }],
      order: [['transactionDate', 'ASC']]
    });

    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'masuk') {
        acc.totalIncome += parseFloat(transaction.amount);
        acc.incomeCount += 1;
      } else {
        acc.totalExpense += parseFloat(transaction.amount);
        acc.expenseCount += 1;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      incomeCount: 0,
      expenseCount: 0
    });

    summary.profit = summary.totalIncome - summary.totalExpense;
    summary.totalTransactions = transactions.length;

    // Group by category
    const byCategory = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = {
          category: transaction.category,
          income: 0,
          expense: 0,
          count: 0
        };
      }
      
      if (transaction.type === 'masuk') {
        acc[transaction.category].income += parseFloat(transaction.amount);
      } else {
        acc[transaction.category].expense += parseFloat(transaction.amount);
      }
      acc[transaction.category].count += 1;
      
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Laporan periode berhasil diambil',
      data: {
        startDate,
        endDate,
        summary,
        transactions,
        byCategory: Object.values(byCategory)
      }
    });
  } catch (error) {
    console.error('Range report error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan periode'
    });
  }
});

module.exports = router;