const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateToken, requireMember } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, requireMember, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -emailVerificationToken -phoneVerificationToken -passwordResetToken');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, requireMember, [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Valid phone number is required'),
  body('address.street').optional().trim().withMessage('Street must be a string'),
  body('address.city').optional().trim().withMessage('City must be a string'),
  body('address.state').optional().trim().withMessage('State must be a string'),
  body('address.zipCode').optional().trim().withMessage('Zip code must be a string'),
  body('address.country').optional().trim().withMessage('Country must be a string')
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

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address'];
    const updates = {};

    // Only allow specific fields to be updated
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -phoneVerificationToken -passwordResetToken');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already in use'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, requireMember, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// Get user's borrowing history
router.get('/borrowing-history', authenticateToken, requireMember, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'returned', 'overdue', 'renewed']).withMessage('Invalid status')
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

    const { page = 1, limit = 10, status } = req.query;

    // Build filter
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(filter)
      .populate('book', 'title author isbn coverImage')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get borrowing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch borrowing history',
      error: error.message
    });
  }
});

// Get user's current borrowed books
router.get('/current-books', authenticateToken, requireMember, async (req, res) => {
  try {
    const activeTransactions = await Transaction.findUserActiveTransactions(req.user._id);

    res.json({
      success: true,
      data: activeTransactions
    });
  } catch (error) {
    console.error('Get current books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current books',
      error: error.message
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, requireMember, async (req, res) => {
  try {
    const userId = req.user._id;

    const totalBorrowed = await Transaction.countDocuments({ user: userId });
    const currentlyBorrowed = await Transaction.countDocuments({ 
      user: userId, 
      status: { $in: ['active', 'overdue'] } 
    });
    const overdueBooks = await Transaction.countDocuments({ 
      user: userId, 
      status: 'overdue' 
    });
    const totalFines = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalFines: { $sum: '$fineAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalBorrowed,
        currentlyBorrowed,
        overdueBooks,
        totalFines: totalFines.length > 0 ? totalFines[0].totalFines : 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
});

// Upload avatar (placeholder - would need multer for file upload)
router.post('/avatar', authenticateToken, requireMember, async (req, res) => {
  try {
    // This is a placeholder for avatar upload
    // In a real implementation, you would use multer to handle file uploads
    res.json({
      success: true,
      message: 'Avatar upload functionality would be implemented here',
      data: {
        avatarUrl: 'placeholder-avatar-url'
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: error.message
    });
  }
});

// Deactivate account
router.delete('/account', authenticateToken, requireMember, [
  body('password').notEmpty().withMessage('Password is required for account deactivation')
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

    const { password } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Check if user has active transactions
    const activeTransactions = await Transaction.findUserActiveTransactions(req.user._id);
    if (activeTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate account with active book transactions'
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account',
      error: error.message
    });
  }
});

module.exports = router;
