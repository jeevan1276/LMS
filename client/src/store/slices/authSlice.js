import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, refreshToken, user } = response.data.data;
      
      // Store tokens and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyEmail(token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const verifyPhone = createAsyncThunk(
  'auth/verifyPhone',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyPhone(phone, otp);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const resendEmailVerification = createAsyncThunk(
  'auth/resendEmailVerification',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.resendEmailVerification(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const resendPhoneVerification = createAsyncThunk(
  'auth/resendPhoneVerification',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await authAPI.resendPhoneVerification(phone);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.resetPassword(token, password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    } catch (error) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    }
  }
);

// Initial state
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  verification: {
    emailSent: false,
    phoneSent: false,
  },
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearVerification: (state) => {
      state.verification = {
        emailSent: false,
        phoneSent: false,
      };
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verification.emailSent = true;
        state.verification.phoneSent = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.isEmailVerified = true;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Verify Phone
      .addCase(verifyPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPhone.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.isPhoneVerified = true;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(verifyPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Resend Email Verification
      .addCase(resendEmailVerification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendEmailVerification.fulfilled, (state) => {
        state.isLoading = false;
        state.verification.emailSent = true;
      })
      .addCase(resendEmailVerification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Resend Phone Verification
      .addCase(resendPhoneVerification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendPhoneVerification.fulfilled, (state) => {
        state.isLoading = false;
        state.verification.phoneSent = true;
      })
      .addCase(resendPhoneVerification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { clearError, clearVerification, updateUser } = authSlice.actions;
export default authSlice.reducer;
