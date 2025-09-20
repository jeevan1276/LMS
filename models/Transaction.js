const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required']
  },
  type: {
    type: String,
    enum: ['borrow', 'return', 'renewal'],
    required: [true, 'Transaction type is required']
  },
  borrowDate: {
    type: Date,
    required: [true, 'Borrow date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'renewed'],
    default: 'active'
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: [0, 'Fine amount cannot be negative']
  },
  renewalCount: {
    type: Number,
    default: 0,
    max: [3, 'Maximum 3 renewals allowed']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Processed by is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ book: 1, status: 1 });
transactionSchema.index({ dueDate: 1, status: 1 });
transactionSchema.index({ type: 1, status: 1 });

// Virtual for days overdue
transactionSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'overdue' && this.dueDate < new Date()) {
    return Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for days until due
transactionSchema.virtual('daysUntilDue').get(function() {
  if (this.status === 'active' && this.dueDate > new Date()) {
    return Math.ceil((this.dueDate - new Date()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Pre-save middleware to calculate due date
transactionSchema.pre('save', function(next) {
  if (this.isNew && this.type === 'borrow') {
    // Set due date to 14 days from borrow date
    this.dueDate = new Date(this.borrowDate.getTime() + (14 * 24 * 60 * 60 * 1000));
  }
  next();
});

// Pre-save middleware to update status based on due date
transactionSchema.pre('save', function(next) {
  if (this.status === 'active' && this.dueDate < new Date() && !this.returnDate) {
    this.status = 'overdue';
  }
  next();
});

// Instance method to calculate fine
transactionSchema.methods.calculateFine = function() {
  if (this.status === 'overdue') {
    const daysOverdue = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    const finePerDay = 1; // $1 per day
    this.fineAmount = daysOverdue * finePerDay;
  }
  return this.fineAmount;
};

// Instance method to renew book
transactionSchema.methods.renewBook = function() {
  if (this.renewalCount >= 3) {
    throw new Error('Maximum renewals reached');
  }
  
  if (this.status !== 'active') {
    throw new Error('Only active transactions can be renewed');
  }
  
  this.renewalCount += 1;
  this.dueDate = new Date(this.dueDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // Add 14 days
  this.status = 'renewed';
  
  return this.save();
};

// Instance method to return book
transactionSchema.methods.returnBook = function() {
  if (this.status === 'returned') {
    throw new Error('Book already returned');
  }
  
  this.returnDate = new Date();
  this.status = 'returned';
  this.calculateFine();
  
  return this.save();
};

// Static method to find overdue transactions
transactionSchema.statics.findOverdue = function() {
  return this.find({
    status: 'active',
    dueDate: { $lt: new Date() }
  }).populate('user book');
};

// Static method to find user's active transactions
transactionSchema.statics.findUserActiveTransactions = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['active', 'overdue'] }
  }).populate('book', 'title author isbn');
};

// Static method to find book's active transactions
transactionSchema.statics.findBookActiveTransactions = function(bookId) {
  return this.find({
    book: bookId,
    status: { $in: ['active', 'overdue'] }
  }).populate('user', 'firstName lastName email');
};

module.exports = mongoose.model('Transaction', transactionSchema);
