import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBookStats, fetchPopularBooks } from '../../store/slices/bookSlice';
import { fetchUserStats, fetchCurrentBooks } from '../../store/slices/userSlice';
import { fetchDashboard } from '../../store/slices/adminSlice';
import { HiBookOpen, HiClipboardList, HiExclamationTriangle, HiClock } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats: bookStats, popularBooks } = useSelector((state) => state.books);
  const { stats: userStats, currentBooks } = useSelector((state) => state.users);
  const { dashboard } = useSelector((state) => state.admin);

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(fetchDashboard());
    } else {
      dispatch(fetchUserStats());
      dispatch(fetchCurrentBooks());
    }
    dispatch(fetchBookStats());
    dispatch(fetchPopularBooks());
  }, [dispatch, user?.role]);

  const stats = user?.role === 'admin' ? dashboard?.statistics : userStats;
  const isAdmin = user?.role === 'admin';

  const statCards = [
    {
      name: 'Total Books',
      value: bookStats?.totalBooks || 0,
      icon: HiBookOpen,
      color: 'bg-blue-500',
    },
    {
      name: 'Available Books',
      value: bookStats?.availableBooks || 0,
      icon: HiBookOpen,
      color: 'bg-green-500',
    },
    {
      name: isAdmin ? 'Total Users' : 'Books Borrowed',
      value: isAdmin ? (stats?.totalUsers || 0) : (stats?.totalBorrowed || 0),
      icon: HiClipboardList,
      color: 'bg-purple-500',
    },
    {
      name: isAdmin ? 'Active Transactions' : 'Currently Borrowed',
      value: isAdmin ? (stats?.activeTransactions || 0) : (stats?.currentlyBorrowed || 0),
      icon: HiClock,
      color: 'bg-orange-500',
    },
  ];

  if (isAdmin) {
    statCards.push(
      {
        name: 'Overdue Books',
        value: stats?.overdueTransactions || 0,
        icon: HiExclamationTriangle,
        color: 'bg-red-500',
      }
    );
  }

  return (
    <div className="page-content">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening in your library today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Books / Recent Activities */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              {isAdmin ? 'Recent Activities' : 'My Current Books'}
            </h3>
          </div>
          <div className="space-y-4">
            {isAdmin ? (
              dashboard?.recentActivities?.length > 0 ? (
                dashboard.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <HiClipboardList className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.user?.firstName} {activity.user?.lastName} {activity.type}ed "{activity.book?.title}"
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activities</p>
              )
            ) : (
              currentBooks?.length > 0 ? (
                currentBooks.map((transaction) => (
                  <div key={transaction._id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <HiBookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.book?.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(transaction.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`badge ${
                        transaction.status === 'overdue' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No books currently borrowed</p>
              )
            )}
          </div>
        </div>

        {/* Popular Books */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Popular Books</h3>
          </div>
          <div className="space-y-4">
            {popularBooks?.length > 0 ? (
              popularBooks.map((book, index) => (
                <div key={book._id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{book.title}</p>
                    <p className="text-xs text-gray-500">by {book.author}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {book.borrowCount} borrows
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No popular books data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/books"
            className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="flex items-center">
              <HiBookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Browse Books</p>
                <p className="text-xs text-gray-500">View all available books</p>
              </div>
            </div>
          </Link>

          <Link
            to="/my-transactions"
            className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="flex items-center">
              <HiClipboardList className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">My Transactions</p>
                <p className="text-xs text-gray-500">View borrowing history</p>
              </div>
            </div>
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/transactions"
                className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-center">
                  <HiClipboardList className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Manage Transactions</p>
                    <p className="text-xs text-gray-500">Issue and return books</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/admin/users"
                className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-center">
                  <HiClipboardList className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Manage Users</p>
                    <p className="text-xs text-gray-500">View and manage users</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
