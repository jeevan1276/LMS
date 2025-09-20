import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './store/slices/authSlice';
import { io } from 'socket.io-client';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/VerifyEmail';
import VerifyPhone from './pages/Auth/VerifyPhone';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Books from './pages/Books/Books';
import BookDetails from './pages/Books/BookDetails';
import AddBook from './pages/Books/AddBook';
import EditBook from './pages/Books/EditBook';
import Transactions from './pages/Transactions/Transactions';
import MyTransactions from './pages/Transactions/MyTransactions';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Profile/Settings';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminUserDetails from './pages/Admin/AdminUserDetails';
import AdminAnalytics from './pages/Admin/AdminAnalytics';

// Not Found
import NotFound from './pages/NotFound/NotFound';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      autoConnect: false,
    });

    if (isAuthenticated && user) {
      socket.connect();
      socket.emit('join', user.id);

      // Listen for real-time notifications
      socket.on('bookIssued', (data) => {
        console.log('Book issued notification:', data);
        // You can dispatch actions to update the UI here
      });

      socket.on('bookReturned', (data) => {
        console.log('Book returned notification:', data);
        // You can dispatch actions to update the UI here
      });

      socket.on('bookRenewed', (data) => {
        console.log('Book renewed notification:', data);
        // You can dispatch actions to update the UI here
      });

      socket.on('bookOverdue', (data) => {
        console.log('Book overdue notification:', data);
        // You can dispatch actions to update the UI here
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated && !isLoading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />
        <Route path="/verify-email" element={!isAuthenticated ? <VerifyEmail /> : <Navigate to="/" replace />} />
        <Route path="/verify-phone" element={!isAuthenticated ? <VerifyPhone /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" replace />} />
        <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" replace />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          
          {/* Books */}
          <Route path="books" element={<Books />} />
          <Route path="books/:id" element={<BookDetails />} />
          <Route path="books/add" element={
            <AdminRoute>
              <AddBook />
            </AdminRoute>
          } />
          <Route path="books/:id/edit" element={
            <AdminRoute>
              <EditBook />
            </AdminRoute>
          } />
          
          {/* Transactions */}
          <Route path="transactions" element={
            <AdminRoute>
              <Transactions />
            </AdminRoute>
          } />
          <Route path="my-transactions" element={<MyTransactions />} />
          
          {/* Profile */}
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="admin/users" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="admin/users/:id" element={
            <AdminRoute>
              <AdminUserDetails />
            </AdminRoute>
          } />
          <Route path="admin/analytics" element={
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          } />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
