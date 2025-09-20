const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { authenticateToken, requireMember } = require('../middleware/auth');

const router = express.Router();

// Get all books with search and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('genre').optional().isString().withMessage('Genre must be a string'),
  query('author').optional().isString().withMessage('Author must be a string'),
  query('available').optional().isBoolean().withMessage('Available must be a boolean')
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

    const {
      page = 1,
      limit = 10,
      search,
      genre,
      author,
      available
    } = req.query;

    // Build filter object
    const filters = { isActive: true };
    
    if (genre) filters.genre = genre;
    if (author) filters.author = new RegExp(author, 'i');
    if (available !== undefined) {
      if (available === 'true') {
        filters.availableCopies = { $gt: 0 };
      } else {
        filters.availableCopies = 0;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = Book.find(filters);

    // Add search functionality
    if (search) {
      query = query.find({
        $or: [
          { title: new RegExp(search, 'i') },
          { author: new RegExp(search, 'i') },
          { isbn: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ]
      });
    }

    // Execute query with pagination
    const books = await query
      .select('-__v')
      .populate('addedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalBooks = await Book.countDocuments(filters);
    const totalPages = Math.ceil(totalBooks / parseInt(limit));

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBooks,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message
    });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('addedBy', 'firstName lastName')
      .select('-__v');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message
    });
  }
});

// Create new book (Admin only)
router.post('/', authenticateToken, requireMember, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('isbn').matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/).withMessage('Valid ISBN is required'),
  body('publisher').trim().notEmpty().withMessage('Publisher is required'),
  body('publicationYear').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Valid publication year is required'),
  body('genre').isIn(['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History', 'Science', 'Technology', 'Philosophy', 'Religion', 'Self-Help', 'Business', 'Education', 'Art', 'Poetry', 'Drama', 'Comedy', 'Other']).withMessage('Valid genre is required'),
  body('totalCopies').isInt({ min: 1, max: 1000 }).withMessage('Total copies must be between 1 and 1000'),
  body('location.shelf').trim().notEmpty().withMessage('Shelf location is required'),
  body('location.row').trim().notEmpty().withMessage('Row location is required')
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

    const bookData = {
      ...req.body,
      addedBy: req.user._id,
      availableCopies: req.body.totalCopies
    };

    const book = new Book(bookData);
    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book
    });
  } catch (error) {
    console.error('Create book error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message
    });
  }
});

// Update book (Admin only)
router.put('/:id', authenticateToken, requireMember, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
  body('publisher').optional().trim().notEmpty().withMessage('Publisher cannot be empty'),
  body('publicationYear').optional().isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Valid publication year is required'),
  body('genre').optional().isIn(['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History', 'Science', 'Technology', 'Philosophy', 'Religion', 'Self-Help', 'Business', 'Education', 'Art', 'Poetry', 'Drama', 'Comedy', 'Other']).withMessage('Valid genre is required'),
  body('totalCopies').optional().isInt({ min: 1, max: 1000 }).withMessage('Total copies must be between 1 and 1000')
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

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Update book data
    const updateData = { ...req.body };
    
    // If total copies is being updated, adjust available copies
    if (updateData.totalCopies !== undefined) {
      const difference = updateData.totalCopies - book.totalCopies;
      updateData.availableCopies = Math.max(0, book.availableCopies + difference);
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('addedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message
    });
  }
});

// Delete book (Admin only)
router.delete('/:id', authenticateToken, requireMember, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book has active transactions
    const activeTransactions = await Transaction.findBookActiveTransactions(req.params.id);
    if (activeTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active transactions'
      });
    }

    // Soft delete by setting isActive to false
    book.isActive = false;
    await book.save();

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message
    });
  }
});

// Get book statistics
router.get('/stats/overview', authenticateToken, requireMember, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments({ isActive: true });
    const availableBooks = await Book.countDocuments({ 
      isActive: true, 
      availableCopies: { $gt: 0 } 
    });
    const borrowedBooks = await Book.countDocuments({ 
      isActive: true, 
      availableCopies: 0 
    });
    const totalTransactions = await Transaction.countDocuments();
    const activeTransactions = await Transaction.countDocuments({ 
      status: { $in: ['active', 'overdue'] } 
    });
    const overdueTransactions = await Transaction.countDocuments({ 
      status: 'overdue' 
    });

    res.json({
      success: true,
      data: {
        totalBooks,
        availableBooks,
        borrowedBooks,
        totalTransactions,
        activeTransactions,
        overdueTransactions
      }
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book statistics',
      error: error.message
    });
  }
});

// Get popular books
router.get('/popular/books', async (req, res) => {
  try {
    const popularBooks = await Book.find({ isActive: true })
      .sort({ borrowCount: -1, lastBorrowed: -1 })
      .limit(10)
      .select('title author isbn borrowCount lastBorrowed coverImage')
      .populate('addedBy', 'firstName lastName');

    res.json({
      success: true,
      data: popularBooks
    });
  } catch (error) {
    console.error('Get popular books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular books',
      error: error.message
    });
  }
});

module.exports = router;
