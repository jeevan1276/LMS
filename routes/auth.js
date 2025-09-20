const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { sendOTP } = require('../utils/smsService');

const router = express.Router();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register new user
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^\+?[\d\s-()]+$/).withMessage('Valid phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, phone, password, role = 'member' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
      });
    }

    // Generate verification tokens
    const emailToken = crypto.randomBytes(32).toString('hex');
    const phoneToken = generateOTP();

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      emailVerificationToken: emailToken,
      phoneVerificationToken: phoneToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await user.save();

    // Send verification emails and SMS
    await sendVerificationEmail(email, emailToken, firstName);
    await sendOTP(phone, phoneToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email and phone number.',
      data: {
        userId: user._id,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login user
router.post('/login', [
  body('emailOrPhone').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { emailOrPhone, password } = req.body;

    // Find user by email or phone
    const user = await User.findByCredentials(emailOrPhone);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          membershipNumber: user.membershipNumber
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Verify email
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
});

// Verify phone
router.post('/verify-phone', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({
      phone,
      phoneVerificationToken: otp,
      phoneVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationToken = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Phone verification failed',
      error: error.message
    });
  }
});

// Resend email verification
router.post('/resend-email-verification', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new verification token
    const emailToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, emailToken, user.firstName);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
});

// Resend phone verification
router.post('/resend-phone-verification', [
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already verified'
      });
    }

    // Generate new OTP
    const phoneToken = generateOTP();
    user.phoneVerificationToken = phoneToken;
    user.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTP(phone, phoneToken);

    res.json({
      success: true,
      message: 'Verification SMS sent successfully'
    });
  } catch (error) {
    console.error('Resend phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification SMS',
      error: error.message
    });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(email, resetToken, user.firstName);

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message
    });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        isPhoneVerified: req.user.isPhoneVerified,
        membershipNumber: req.user.membershipNumber,
        avatar: req.user.avatar,
        address: req.user.address,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: error.message
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

module.exports = router;
