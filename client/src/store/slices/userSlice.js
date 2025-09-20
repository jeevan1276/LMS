import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../../services/api';

// Async thunks
export const fetchProfile = createAsyncThunk(
  'users/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await usersAPI.updateProfile(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'users/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await usersAPI.changePassword(passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchBorrowingHistory = createAsyncThunk(
  'users/fetchBorrowingHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getBorrowingHistory(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCurrentBooks = createAsyncThunk(
  'users/fetchCurrentBooks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getCurrentBooks();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'users/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUserStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'users/uploadAvatar',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await usersAPI.uploadAvatar(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deactivateAccount = createAsyncThunk(
  'users/deactivateAccount',
  async (password, { rejectWithValue }) => {
    try {
      const response = await usersAPI.deactivateAccount(password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  profile: null,
  borrowingHistory: [],
  currentBooks: [],
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  isLoading: false,
  error: null,
};

// Users slice
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Borrowing History
      .addCase(fetchBorrowingHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBorrowingHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.borrowingHistory = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBorrowingHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Current Books
      .addCase(fetchCurrentBooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooks = action.payload;
      })
      .addCase(fetchCurrentBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch User Stats
      .addCase(fetchUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.avatar = action.payload.avatarUrl;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Deactivate Account
      .addCase(deactivateAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deactivateAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.profile = null;
      })
      .addCase(deactivateAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearProfile } = userSlice.actions;
export default userSlice.reducer;
