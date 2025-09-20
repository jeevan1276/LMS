import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { HiPhone, HiCheckCircle } from 'react-icons/hi';
import { verifyPhone, resendPhoneVerification, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const VerifyPhone = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [isVerified, setIsVerified] = useState(false);
  const [phone, setPhone] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Phone verification failed');
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(verifyPhone({ phone: data.phone, otp: data.otp }));
  };

  const handleResend = () => {
    if (phone) {
      dispatch(resendPhoneVerification(phone));
      toast.success('Verification SMS sent successfully');
    } else {
      toast.error('Please enter your phone number first');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <HiPhone className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Phone
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification code to your phone number.
          </p>
        </div>

        {isVerified ? (
          <div className="text-center">
            <HiCheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Phone Verified Successfully!
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Your phone number has been verified.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 btn btn-primary"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+?[\d\s-()]+$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  type="tel"
                  className={`input pl-10 ${errors.phone ? 'input-error' : ''}`}
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                {...register('otp', { 
                  required: 'Verification code is required',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'Code must be 6 digits'
                  }
                })}
                type="text"
                maxLength="6"
                className={`input ${errors.otp ? 'input-error' : ''}`}
                placeholder="Enter 6-digit code"
              />
              {errors.otp && (
                <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full flex justify-center py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="loading-spinner h-5 w-5"></div>
                ) : (
                  'Verify Phone Number'
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                className="btn btn-secondary w-full"
              >
                Resend Code
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyPhone;
