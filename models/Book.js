const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
  },
  publisher: {
    type: String,
    required: [true, 'Publisher is required'],
    trim: true,
    maxlength: [100, 'Publisher name cannot exceed 100 characters']
  },
  publicationYear: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: [1000, 'Publication year must be valid'],
    max: [new Date().getFullYear(), 'Publication year cannot be in the future']
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: [
      'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
      'Romance', 'Thriller', 'Biography', 'History', 'Science',
      'Technology', 'Philosophy', 'Religion', 'Self-Help', 'Business',
      'Education', 'Art', 'Poetry', 'Drama', 'Comedy', 'Other'
    ]
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    default: 'English'
  },
  pages: {
    type: Number,
    min: [1, 'Book must have at least 1 page'],
    max: [10000, 'Pages cannot exceed 10000']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  coverImage: {
    type: String,
    default: ''
  },
  totalCopies: {
    type: Number,
    required: [true, 'Total copies is required'],
    min: [1, 'Must have at least 1 copy'],
    max: [1000, 'Cannot have more than 1000 copies']
  },
  availableCopies: {
    type: Number,
    required: [true, 'Available copies is required'],
    min: [0, 'Available copies cannot be negative']
  },
  location: {
    shelf: {
      type: String,
      required: [true, 'Shelf location is required'],
      trim: true
    },
    row: {
      type: String,
      required: [true, 'Row location is required'],
      trim: true
    }
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastBorrowed: Date,
  borrowCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ isbn: 1 });
bookSchema.index({ genre: 1 });
bookSchema.index({ isActive: 1 });
bookSchema.index({ availableCopies: 1 });

// Virtual for availability status
bookSchema.virtual('isAvailable').get(function() {
  return this.availableCopies > 0;
});

// Pre-save middleware to ensure available copies don't exceed total copies
bookSchema.pre('save', function(next) {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

// Instance method to check if book can be borrowed
bookSchema.methods.canBorrow = function() {
  return this.isActive && this.availableCopies > 0;
};

// Instance method to update copies when book is borrowed
bookSchema.methods.borrowBook = function() {
  if (this.canBorrow()) {
    this.availableCopies -= 1;
    this.borrowCount += 1;
    this.lastBorrowed = new Date();
    return this.save();
  }
  throw new Error('Book cannot be borrowed');
};

// Instance method to update copies when book is returned
bookSchema.methods.returnBook = function() {
  if (this.availableCopies < this.totalCopies) {
    this.availableCopies += 1;
    return this.save();
  }
  throw new Error('All copies are already available');
};

// Static method to search books
bookSchema.statics.searchBooks = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    ...filters
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Book', bookSchema);
