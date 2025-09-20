const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send OTP via SMS
const sendOTP = async (phoneNumber, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your Library Management System verification code is: ${otp}. This code will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('OTP SMS sent:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    return { success: false, error: error.message };
  }
};

// Send book due reminder SMS
const sendBookDueReminderSMS = async (phoneNumber, bookTitle, dueDate) => {
  try {
    const message = await client.messages.create({
      body: `Reminder: Your book "${bookTitle}" is due on ${new Date(dueDate).toLocaleDateString()}. Please return it on time to avoid late fees.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('Book due reminder SMS sent:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending book due reminder SMS:', error);
    return { success: false, error: error.message };
  }
};

// Send overdue book notification SMS
const sendOverdueNotificationSMS = async (phoneNumber, bookTitle, daysOverdue, fineAmount) => {
  try {
    const message = await client.messages.create({
      body: `URGENT: Your book "${bookTitle}" is ${daysOverdue} days overdue. Fine: $${fineAmount}. Please return immediately.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('Overdue notification SMS sent:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending overdue notification SMS:', error);
    return { success: false, error: error.message };
  }
};

// Send account verification SMS
const sendAccountVerificationSMS = async (phoneNumber, firstName) => {
  try {
    const message = await client.messages.create({
      body: `Welcome ${firstName}! Your Library Management System account has been created successfully. You can now access all library services.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('Account verification SMS sent:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending account verification SMS:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTP,
  sendBookDueReminderSMS,
  sendOverdueNotificationSMS,
  sendAccountVerificationSMS
};
