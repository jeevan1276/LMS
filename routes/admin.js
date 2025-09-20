const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendAccountVerificationSMS } = require('../utils/smsService');

const router = express.Router();

// Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('role').optional().isIn(['admin', 'member']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, search, role, isActive } = req.query;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Add search functionality
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { membershipNumber: new RegExp(search, 'i') }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password -emailVerificationToken -phoneVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get user by ID (Admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -phoneVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's transaction history
    const transactions = await Transaction.find({ user: req.params.id })
      .populate('book', 'title author isbn')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        user,
        recentTransactions: transactions
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// Update user (Admin only)
router.put('/users/:id', authenticateToken, requireAdmin, [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Valid phone number is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === req.params.id && req.body.role && req.body.role !== user.role) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'email', 'phone', 'role', 'isActive', 'address'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -phoneVerificationToken -passwordResetToken');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number already in use'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active transactions
    const activeTransactions = await Transaction.findUserActiveTransactions(req.params.id);
    if (activeTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active book transactions'
      });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Get dashboard statistics (Admin only)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalBooks,
      totalTransactions,
      activeTransactions,
      overdueTransactions,
      newUsersThisMonth,
      newBooksThisMonth,
      totalFines
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Book.countDocuments({ isActive: true }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: { $in: ['active', 'overdue'] } }),
      Transaction.countDocuments({ status: 'overdue' }),
      User.countDocuments({
        isActive: true,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      Book.countDocuments({
        isActive: true,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      Transaction.aggregate([
        { $group: { _id: null, totalFines: { $sum: '$fineAmount' } } }
      ])
    ]);

    // Get recent activities
    const recentTransactions = await Transaction.find()
      .populate('user', 'firstName lastName')
      .populate('book', 'title author')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get popular books
    const popularBooks = await Book.find({ isActive: true })
      .sort({ borrowCount: -1 })
      .limit(5)
      .select('title author borrowCount');

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalBooks,
          totalTransactions,
          activeTransactions,
          overdueTransactions,
          newUsersThisMonth,
          newBooksThisMonth,
          totalFines: totalFines.length > 0 ? totalFines[0].totalFines : 0
        },
        recentActivities: recentTransactions,
        popularBooks
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Get system analytics (Admin only)
router.get('/analytics', authenticateToken, requireAdmin, [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get transaction trends
    const transactionTrends = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get genre distribution
    const genreDistribution = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get user registration trends
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        transactionTrends,
        genreDistribution,
        userTrends
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Send notification to all users (Admin only)
router.post('/notify-all', authenticateToken, requireAdmin, [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['email', 'sms', 'both']).withMessage('Type must be email, sms, or both')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { subject, message, type } = req.body;

    // Get all active users
    const users = await User.find({ isActive: true }).select('email phone firstName');

    // This is a placeholder for notification sending
    // In a real implementation, you would send emails and SMS to all users
    console.log(`Sending ${type} notification to ${users.length} users:`, { subject, message });

    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      data: {
        usersNotified: users.length,
        type
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

module.exports = router;
