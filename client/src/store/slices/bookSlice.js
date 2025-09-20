import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { booksAPI } from '../../services/api';

// Async thunks
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getBooks(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchBook = createAsyncThunk(
  'books/fetchBook',
  async (id, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getBook(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createBook = createAsyncThunk(
  'books/createBook',
  async (bookData, { rejectWithValue }) => {
    try {
      const response = await booksAPI.createBook(bookData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateBook = createAsyncThunk(
  'books/updateBook',
  async ({ id, bookData }, { rejectWithValue }) => {
    try {
      const response = await booksAPI.updateBook(id, bookData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteBook = createAsyncThunk(
  'books/deleteBook',
  async (id, { rejectWithValue }) => {
    try {
      await booksAPI.deleteBook(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchBookStats = createAsyncThunk(
  'books/fetchBookStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getBookStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPopularBooks = createAsyncThunk(
  'books/fetchPopularBooks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getPopularBooks();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  books: [],
  currentBook: null,
  popularBooks: [],
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: '',
    genre: '',
    author: '',
    available: undefined,
  },
  isLoading: false,
  error: null,
};

// Books slice
const bookSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentBook: (state) => {
      state.currentBook = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        genre: '',
        author: '',
        available: undefined,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Books
      .addCase(fetchBooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload.books;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Book
      .addCase(fetchBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBook = action.payload;
      })
      .addCase(fetchBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Book
      .addCase(createBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books.unshift(action.payload);
      })
      .addCase(createBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Book
      .addCase(updateBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBook.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.books.findIndex(book => book._id === action.payload._id);
        if (index !== -1) {
          state.books[index] = action.payload;
        }
        if (state.currentBook && state.currentBook._id === action.payload._id) {
          state.currentBook = action.payload;
        }
      })
      .addCase(updateBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Book
      .addCase(deleteBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = state.books.filter(book => book._id !== action.payload);
        if (state.currentBook && state.currentBook._id === action.payload) {
          state.currentBook = null;
        }
      })
      .addCase(deleteBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Book Stats
      .addCase(fetchBookStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchBookStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Popular Books
      .addCase(fetchPopularBooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPopularBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularBooks = action.payload;
      })
      .addCase(fetchPopularBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentBook, setFilters, clearFilters } = bookSlice.actions;
export default bookSlice.reducer;
