const express = require('express');
const { query, validationResult } = require('express-validator');
const { Transaction, User, PlateCount } = require('../models');
const { authorize } = require('../middleware/auth');
const { Op, fn, col, where } = require('sequelize');
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

    console.log('Current server time:', today);
    console.log('Current UTC time:', today.toUTCString());

    // Get today's date as YYYY-MM-DD string (in local timezone)
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDate = String(today.getDate()).padStart(2, '0');
    const todayString = `${todayYear}-${todayMonth}-${todayDate}`;

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Previous month dates
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    console.log('Today string (for comparison):', todayString);

    // Today's summary - using date string comparison
    const todayTransactions = await Transaction.findAll({
      where: where(
        fn('DATE', col('transaction_date')),
        Op.eq,
        todayString
      )
    });

    console.log('Today transactions found:', todayTransactions.length);

    // This month's summary - using date range
    const monthTransactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.gte]: startOfMonth,
          [Op.lt]: new Date(endOfMonth.getTime() + 86400000) // Add 1 day
        }
      }
    });

    // Previous month's summary - for comparison
    const prevMonthTransactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.gte]: startOfPrevMonth,
          [Op.lt]: new Date(endOfPrevMonth.getTime() + 86400000)
        }
      }
    });

    // --- CATERING / PLATE COUNT DATA ---

    // Today's Catering
    const todayPlateCounts = await PlateCount.findAll({
      where: where(
        fn('DATE', col('date')),
        Op.eq,
        todayString
      )
    });

    // This Month's Catering
    const monthPlateCounts = await PlateCount.findAll({
      where: {
        date: {
          [Op.gte]: startOfMonth,
          [Op.lt]: new Date(endOfMonth.getTime() + 86400000)
        }
      }
    });

    // Helper to calculate catering summary
    const calculateCateringSummary = (records, startDate, endDate) => {
      const summary = records.reduce((acc, record) => {
        acc.totalPlates += parseInt(record.totalPlates || 0);
        acc.totalTransfer += parseFloat(record.totalTransfer || 0);
        acc.totalNetReturn += parseFloat(record.totalNetReturn || 0);
        acc.totalNetIncome += parseFloat(record.totalNetIncome || 0);
        acc.totalTax += parseFloat(record.totalIncomeTax || 0) + parseFloat(record.totalReturnTax || 0);
        return acc;
      }, {
        totalPlates: 0,
        totalTransfer: 0,
        totalNetReturn: 0,
        totalNetIncome: 0,
        totalTax: 0
      });

      // Admin Fee Calculation
      const ADMIN_FEE_PER_WEEK = 2900;
      let weekCount = 0;

      if (records.length > 0) {
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
          weekCount = Math.ceil(daysDiff / 7);
        } else {
          // If no range provided (e.g. just today w/o range logic), default to 1 if data exists
          weekCount = 1;
        }
      }

      const totalAdminFee = weekCount * ADMIN_FEE_PER_WEEK;

      // Calculate derived values
      // Jumlah Ditransfer Pabrik = Nilai Piring (Total Transfer) - Pajak - Admin
      const amountFromFactory = summary.totalTransfer - summary.totalTax - totalAdminFee;

      // Penghasilan Bersih Final = Penghasilan Kotor (Total Net Income DB) - Admin
      const finalNetIncome = summary.totalNetIncome - totalAdminFee;

      return {
        totalPlates: summary.totalPlates,
        amountFromFactory,
        totalNetReturn: summary.totalNetReturn,
        finalNetIncome,
        // Keep these for potential debug or other uses
        totalTransfer: summary.totalTransfer,
        totalAdminFee
      };
    };

    const todayCatering = calculateCateringSummary(todayPlateCounts, todayString, todayString);
    const monthCatering = calculateCateringSummary(monthPlateCounts, startOfMonth, endOfMonth);

    console.log('Month transactions found:', monthTransactions.length);
    console.log('Previous month transactions found:', prevMonthTransactions.length);

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

    // Previous month totals
    const prevMonthIncome = prevMonthTransactions
      .filter(t => t.type === 'masuk')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const prevMonthExpense = prevMonthTransactions
      .filter(t => t.type === 'keluar')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Total users
    const totalUsers = await User.count();
    const totalActiveUsers = await User.count({ where: { isActive: true } });

    // Last 7 days data for chart (including today)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const dayTransactions = await Transaction.findAll({
        where: where(fn('DATE', col('transaction_date')), Op.eq, dateString)
      });

      const dayPlateCounts = await PlateCount.findAll({
        where: where(fn('DATE', col('date')), Op.eq, dateString)
      });

      const dayIncome = dayTransactions
        .filter(t => t.type === 'masuk')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const dayExpense = dayTransactions
        .filter(t => t.type === 'keluar')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Catering daily income (Net Income)
      // Note: Admin fee is weekly, so technically hard to split daily perfectly without complex logic. 
      // For chart visual, we'll use totalNetIncome from the record.
      const dayCateringIncome = dayPlateCounts.reduce((sum, p) => sum + parseFloat(p.totalNetIncome || 0), 0);

      last7Days.push({
        date: dateString,
        income: dayIncome,
        expense: dayExpense,
        catering: dayCateringIncome,
        profit: (dayIncome + dayCateringIncome) - dayExpense,
        count: dayTransactions.length + dayPlateCounts.length
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

    // Add Catering to Breakdown
    if (monthCatering.finalNetIncome > 0 || monthCatering.totalPlates > 0) {
      categoryBreakdown['Catering'] = {
        category: 'Catering',
        income: monthCatering.finalNetIncome, // Use final net which includes admin fee deduction
        expense: 0, // Since we used net income, expense is effectively deduced already
        count: monthCatering.totalPlates // Showing plate count as "count" or record count? Let's use record count for consistency with transactions
      };
      // Actual record count for catering this month
      categoryBreakdown['Catering'].count = monthPlateCounts.length;
    }

    // Recent Activities (Merge Transaction + Catering)
    const recentTx = await Transaction.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }]
    });

    const recentCateringRecords = await PlateCount.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }]
    });

    const mergedActivities = [
      ...recentTx.map(t => ({
        id: t.id,
        type: 'transaction',
        activityType: t.type, // 'masuk' or 'keluar'
        category: t.category,
        amount: parseFloat(t.amount),
        date: t.transactionDate,
        createdAt: t.createdAt,
        user: t.user,
        description: t.description
      })),
      ...recentCateringRecords.map(c => ({
        id: c.id,
        type: 'catering',
        activityType: 'masuk',
        category: 'Catering',
        amount: parseFloat(c.totalNetIncome), // Show Net Income
        date: c.date,
        createdAt: c.createdAt,
        user: c.user,
        description: `Input Piring (${c.shift})`
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    res.json({
      success: true,
      message: 'Dashboard data berhasil diambil',
      data: {
        today: {
          income: todayIncome,
          expense: todayExpense,
          profit: todayIncome - todayExpense,
          transactions: todayTransactions.length,
          catering: todayCatering
        },
        thisMonth: {
          income: monthIncome,
          expense: monthExpense,
          profit: monthIncome - monthExpense,
          transactions: monthTransactions.length,
          catering: monthCatering
        },
        prevMonth: {
          income: prevMonthIncome,
          expense: prevMonthExpense,
          profit: prevMonthIncome - prevMonthExpense,
          transactions: prevMonthTransactions.length
        },
        users: {
          total: totalUsers,
          active: totalActiveUsers
        },
        recentTransactions: mergedActivities, // Replaced with merged list
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

    // Format date in local timezone (YYYY-MM-DD)
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const targetDateString = `${year}-${month}-${day}`;

    console.log('Daily report for:', targetDateString);

    const transactions = await Transaction.findAll({
      where: where(
        fn('DATE', col('transaction_date')),
        Op.eq,
        targetDateString
      ),
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
        date: targetDateString,
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

    const startOfMonthString = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonthDate = new Date(year, month, 0);
    const daysInMonth = endOfMonthDate.getDate();
    const endOfMonthString = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const transactions = await Transaction.findAll({
      where: sequelize.where(
        sequelize.fn('DATE', sequelize.col('transaction_date')),
        Op.between,
        [startOfMonthString, endOfMonthString]
      ),
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
  query('startDate').isString().withMessage('Format tanggal mulai tidak valid'),
  query('endDate').isString().withMessage('Format tanggal akhir tidak valid')
], validateInput, authorize(1), async (req, res) => {
  try {
    const startDate = req.query.startDate.split('T')[0];
    const endDate = req.query.endDate.split('T')[0];

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal mulai harus lebih kecil dari tanggal akhir'
      });
    }

    const transactions = await Transaction.findAll({
      where: sequelize.where(
        sequelize.fn('DATE', sequelize.col('transaction_date')),
        Op.between,
        [startDate, endDate]
      ),
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