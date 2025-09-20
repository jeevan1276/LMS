import React from 'react';
import { Link } from 'react-router-dom';
import { HiHome, HiArrowLeft } from 'react-icons/hi';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center"
          >
            <HiHome className="h-4 w-4 mr-2" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary inline-flex items-center ml-4"
          >
            <HiArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
