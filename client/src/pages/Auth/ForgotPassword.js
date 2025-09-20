import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { HiMail, HiArrowLeft } from 'react-icons/hi';
import { forgotPassword, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Failed to send reset email');
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(forgotPassword(data.email));
    setIsEmailSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <HiMail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isEmailSent 
              ? 'Check your email for reset instructions'
              : 'Enter your email address and we\'ll send you a reset link'
            }
          </p>
        </div>

        {isEmailSent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                Password reset email sent successfully! Check your inbox and follow the instructions to reset your password.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary w-full"
              >
                Back to Login
              </button>
              <button
                onClick={() => setIsEmailSent(false)}
                className="btn btn-secondary w-full"
              >
                Send Another Email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full flex justify-center py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="loading-spinner h-5 w-5"></div>
                ) : (
                  'Send Reset Email'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <HiArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
