const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, token, firstName) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Library Management System!</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering with our library management system. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Library Management System. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, firstName) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Library Management System. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send book due reminder email
const sendBookDueReminder = async (email, firstName, bookTitle, dueDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Book Due Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Book Due Reminder</h2>
          <p>Hello ${firstName},</p>
          <p>This is a reminder that your borrowed book is due soon:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Book Details:</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          </div>
          <p>Please return the book on time to avoid late fees.</p>
          <p>Thank you for using our library management system!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Library Management System. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Book due reminder sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending book due reminder:', error);
    return { success: false, error: error.message };
  }
};

// Send overdue book notification
const sendOverdueNotification = async (email, firstName, bookTitle, daysOverdue, fineAmount) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Overdue Book Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Overdue Book Notification</h2>
          <p>Hello ${firstName},</p>
          <p>Your borrowed book is overdue. Please return it immediately to avoid additional charges:</p>
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin: 0 0 10px 0; color: #721c24;">Book Details:</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
            <p><strong>Fine Amount:</strong> $${fineAmount}</p>
          </div>
          <p>Please return the book as soon as possible to avoid further charges.</p>
          <p>Thank you for your cooperation.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Library Management System. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Overdue notification sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending overdue notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookDueReminder,
  sendOverdueNotification
};
