const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const { authenticateToken, requireMember } = require('../middleware/auth');
const { sendBookDueReminder, sendOverdueNotification } = require('../utils/emailService');
const { sendBookDueReminderSMS, sendOverdueNotificationSMS } = require('../utils/smsService');

const router = express.Router();

// Issue a book
router.post('/issue', authenticateToken, requireMember, [
  body('bookId').isMongoId().withMessage('Valid book ID is required'),
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required')
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

    const { bookId, userId, dueDate } = req.body;

    // Check if user is admin (only admins can issue books)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to issue books'
      });
    }

    // Find book and user
    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if book is available
    if (!book.canBorrow()) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available for borrowing'
      });
    }

    // Check if user has any overdue books
    const overdueBooks = await Transaction.find({
      user: userId,
      status: 'overdue'
    });

    if (overdueBooks.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User has overdue books. Please return them before borrowing new books.'
      });
    }

    // Check if user has reached maximum borrowing limit (5 books)
    const activeTransactions = await Transaction.find({
      user: userId,
      status: { $in: ['active', 'overdue'] }
    });

    if (activeTransactions.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'User has reached maximum borrowing limit (5 books)'
      });
    }

    // Create transaction
    const transaction = new Transaction({
      user: userId,
      book: bookId,
      type: 'borrow',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      processedBy: req.user._id
    });

    // Update book availability
    await book.borrowBook();
    await transaction.save();

    // Populate the transaction with user and book details
    await transaction.populate([
      { path: 'user', select: 'firstName lastName email phone membershipNumber' },
      { path: 'book', select: 'title author isbn' },
      { path: 'processedBy', select: 'firstName lastName' }
    ]);

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('bookIssued', {
        message: `Book "${book.title}" has been issued to you`,
        transaction: transaction
      });
    }

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue book',
      error: error.message
    });
  }
});

// Return a book
router.post('/return', authenticateToken, requireMember, [
  body('transactionId').isMongoId().withMessage('Valid transaction ID is required')
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

    const { transactionId } = req.body;

    // Check if user is admin (only admins can return books)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to return books'
      });
    }

    const transaction = await Transaction.findById(transactionId)
      .populate('user', 'firstName lastName email phone')
      .populate('book', 'title author isbn');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Book already returned'
      });
    }

    // Return the book
    await transaction.returnBook();
    await transaction.book.returnBook();

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(transaction.user._id.toString()).emit('bookReturned', {
        message: `Book "${transaction.book.title}" has been returned`,
        transaction: transaction
      });
    }

    res.json({
      success: true,
      message: 'Book returned successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return book',
      error: error.message
    });
  }
});

// Renew a book
router.post('/renew', authenticateToken, requireMember, [
  body('transactionId').isMongoId().withMessage('Valid transaction ID is required')
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

    const { transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId)
      .populate('user', 'firstName lastName email phone')
      .populate('book', 'title author isbn');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user is the borrower or admin
    if (req.user._id.toString() !== transaction.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only renew your own books'
      });
    }

    // Renew the book
    await transaction.renewBook();

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(transaction.user._id.toString()).emit('bookRenewed', {
        message: `Book "${transaction.book.title}" has been renewed`,
        transaction: transaction
      });
    }

    res.json({
      success: true,
      message: 'Book renewed successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Renew book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew book',
      error: error.message
    });
  }
});

// Get user's transactions
router.get('/my-transactions', authenticateToken, requireMember, [
  query('status').optional().isIn(['active', 'returned', 'overdue', 'renewed']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { status, page = 1, limit = 10 } = req.query;

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
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Get all transactions (Admin only)
router.get('/', authenticateToken, requireMember, [
  query('status').optional().isIn(['active', 'returned', 'overdue', 'renewed']).withMessage('Invalid status'),
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('bookId').optional().isMongoId().withMessage('Invalid book ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status, userId, bookId, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;
    if (bookId) filter.book = bookId;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(filter)
      .populate('user', 'firstName lastName email phone membershipNumber')
      .populate('book', 'title author isbn')
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
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, requireMember, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'firstName lastName email phone membershipNumber')
      .populate('book', 'title author isbn coverImage')
      .populate('processedBy', 'firstName lastName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user can view this transaction
    if (req.user.role !== 'admin' && transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
});

// Get overdue transactions
router.get('/overdue/list', authenticateToken, requireMember, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const overdueTransactions = await Transaction.findOverdue();

    res.json({
      success: true,
      data: overdueTransactions
    });
  } catch (error) {
    console.error('Get overdue transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue transactions',
      error: error.message
    });
  }
});

// Send reminder for due books
router.post('/send-reminder/:transactionId', authenticateToken, requireMember, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('user', 'firstName lastName email phone')
      .populate('book', 'title author isbn');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Send email reminder
    await sendBookDueReminder(
      transaction.user.email,
      transaction.user.firstName,
      transaction.book.title,
      transaction.dueDate
    );

    // Send SMS reminder
    await sendBookDueReminderSMS(
      transaction.user.phone,
      transaction.book.title,
      transaction.dueDate
    );

    res.json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: error.message
    });
  }
});

module.exports = router;
