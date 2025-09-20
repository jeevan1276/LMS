import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { HiMail, HiCheckCircle } from 'react-icons/hi';
import { verifyEmail, resendEmailVerification, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      dispatch(verifyEmail(token));
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Email verification failed');
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(resendEmailVerification(data.email));
  };

  const handleResendSuccess = () => {
    toast.success('Verification email sent successfully');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <HiMail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to your email address.
          </p>
        </div>

        {isVerified ? (
          <div className="text-center">
            <HiCheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Email Verified Successfully!
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been verified. You can now access all features.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 btn btn-primary"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the email? Check your spam folder or resend the verification email.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full flex justify-center py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="loading-spinner h-5 w-5"></div>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
