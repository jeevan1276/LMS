import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionsAPI } from '../../services/api';

// Async thunks
export const issueBook = createAsyncThunk(
  'transactions/issueBook',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.issueBook(transactionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const returnBook = createAsyncThunk(
  'transactions/returnBook',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.returnBook(transactionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const renewBook = createAsyncThunk(
  'transactions/renewBook',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.renewBook(transactionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMyTransactions = createAsyncThunk(
  'transactions/fetchMyTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getMyTransactions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAllTransactions = createAsyncThunk(
  'transactions/fetchAllTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getAllTransactions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTransaction = createAsyncThunk(
  'transactions/fetchTransaction',
  async (id, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getTransaction(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchOverdueTransactions = createAsyncThunk(
  'transactions/fetchOverdueTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getOverdueTransactions();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendReminder = createAsyncThunk(
  'transactions/sendReminder',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.sendReminder(transactionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  transactions: [],
  myTransactions: [],
  overdueTransactions: [],
  currentTransaction: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  myPagination: {
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    status: '',
    userId: '',
    bookId: '',
  },
  isLoading: false,
  error: null,
};

// Transactions slice
const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: '',
        userId: '',
        bookId: '',
      };
    },
    updateTransaction: (state, action) => {
      const { transactionId, updates } = action.payload;
      const index = state.transactions.findIndex(t => t._id === transactionId);
      if (index !== -1) {
        state.transactions[index] = { ...state.transactions[index], ...updates };
      }
      
      const myIndex = state.myTransactions.findIndex(t => t._id === transactionId);
      if (myIndex !== -1) {
        state.myTransactions[myIndex] = { ...state.myTransactions[myIndex], ...updates };
      }
      
      if (state.currentTransaction && state.currentTransaction._id === transactionId) {
        state.currentTransaction = { ...state.currentTransaction, ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Issue Book
      .addCase(issueBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(issueBook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload);
      })
      .addCase(issueBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Return Book
      .addCase(returnBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(returnBook.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        
        const myIndex = state.myTransactions.findIndex(t => t._id === action.payload._id);
        if (myIndex !== -1) {
          state.myTransactions[myIndex] = action.payload;
        }
      })
      .addCase(returnBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Renew Book
      .addCase(renewBook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(renewBook.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        
        const myIndex = state.myTransactions.findIndex(t => t._id === action.payload._id);
        if (myIndex !== -1) {
          state.myTransactions[myIndex] = action.payload;
        }
      })
      .addCase(renewBook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch My Transactions
      .addCase(fetchMyTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTransactions = action.payload.transactions;
        state.myPagination = action.payload.pagination;
      })
      .addCase(fetchMyTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch All Transactions
      .addCase(fetchAllTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Transaction
      .addCase(fetchTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Overdue Transactions
      .addCase(fetchOverdueTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOverdueTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overdueTransactions = action.payload;
      })
      .addCase(fetchOverdueTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Send Reminder
      .addCase(sendReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendReminder.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearCurrentTransaction, 
  setFilters, 
  clearFilters, 
  updateTransaction 
} = transactionSlice.actions;
export default transactionSlice.reducer;
