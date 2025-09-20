import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

// Async thunks
export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUser = createAsyncThunk(
  'admin/fetchUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getUser(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateUser(id, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await adminAPI.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getAnalytics(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const notifyAll = createAsyncThunk(
  'admin/notifyAll',
  async (notificationData, { rejectWithValue }) => {
    try {
      const response = await adminAPI.notifyAll(notificationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  users: [],
  currentUser: null,
  dashboard: null,
  analytics: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: '',
    role: '',
    isActive: undefined,
  },
  isLoading: false,
  error: null,
};

// Admin slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        role: '',
        isActive: undefined,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch User
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(user => user._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser && state.currentUser._id === action.payload._id) {
          state.currentUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user._id !== action.payload);
        if (state.currentUser && state.currentUser._id === action.payload) {
          state.currentUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Notify All
      .addCase(notifyAll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(notifyAll.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(notifyAll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentUser, setFilters, clearFilters } = adminSlice.actions;
export default adminSlice.reducer;
