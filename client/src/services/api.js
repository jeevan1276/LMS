import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  verifyPhone: (phone, otp) => api.post('/auth/verify-phone', { phone, otp }),
  resendEmailVerification: (email) => api.post('/auth/resend-email-verification', { email }),
  resendPhoneVerification: (phone) => api.post('/auth/resend-phone-verification', { phone }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Books API
export const booksAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  createBook: (bookData) => api.post('/books', bookData),
  updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
  deleteBook: (id) => api.delete(`/books/${id}`),
  getBookStats: () => api.get('/books/stats/overview'),
  getPopularBooks: () => api.get('/books/popular/books'),
};

// Transactions API
export const transactionsAPI = {
  issueBook: (transactionData) => api.post('/transactions/issue', transactionData),
  returnBook: (transactionId) => api.post('/transactions/return', { transactionId }),
  renewBook: (transactionId) => api.post('/transactions/renew', { transactionId }),
  getMyTransactions: (params) => api.get('/transactions/my-transactions', { params }),
  getAllTransactions: (params) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  getOverdueTransactions: () => api.get('/transactions/overdue/list'),
  sendReminder: (transactionId) => api.post(`/transactions/send-reminder/${transactionId}`),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  getBorrowingHistory: (params) => api.get('/users/borrowing-history', { params }),
  getCurrentBooks: () => api.get('/users/current-books'),
  getUserStats: () => api.get('/users/stats'),
  uploadAvatar: (formData) => api.post('/users/avatar', formData),
  deactivateAccount: (password) => api.delete('/users/account', { data: { password } }),
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  notifyAll: (notificationData) => api.post('/admin/notify-all', notificationData),
};

export default api;
