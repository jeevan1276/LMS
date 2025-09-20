import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiBookOpen, 
  HiClipboardList, 
  HiUser, 
  HiCog,
  HiUsers,
  HiChartBar,
  HiLogout
} from 'react-icons/hi';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HiHome },
    { name: 'Books', href: '/books', icon: HiBookOpen },
    { name: 'My Transactions', href: '/my-transactions', icon: HiClipboardList },
    { name: 'Profile', href: '/profile', icon: HiUser },
    { name: 'Settings', href: '/settings', icon: HiCog },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: HiChartBar },
    { name: 'All Transactions', href: '/transactions', icon: HiClipboardList },
    { name: 'Users', href: '/admin/users', icon: HiUsers },
    { name: 'Analytics', href: '/admin/analytics', icon: HiChartBar },
  ];

  const allNavigation = user?.role === 'admin' 
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-gray-800">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Logo */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
          <HiBookOpen className="h-8 w-8 text-blue-400" />
          <span className="ml-2 text-white text-lg font-semibold">LMS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {allNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="ml-auto p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <HiLogout className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
