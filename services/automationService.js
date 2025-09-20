const cron = require('cron');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Book = require('../models/Book');
const { sendBookDueReminder, sendOverdueNotification } = require('../utils/emailService');
const { sendBookDueReminderSMS, sendOverdueNotificationSMS } = require('../utils/smsService');

class AutomationService {
  constructor(io) {
    this.io = io;
    this.jobs = [];
    this.initializeJobs();
  }

  initializeJobs() {
    // Check for overdue books every hour
    this.jobs.push(
      new cron.CronJob('0 * * * *', () => {
        this.checkOverdueBooks();
      }, null, true, 'America/New_York')
    );

    // Send due reminders every day at 9 AM
    this.jobs.push(
      new cron.CronJob('0 9 * * *', () => {
        this.sendDueReminders();
      }, null, true, 'America/New_York')
    );

    // Send overdue notifications every day at 6 PM
    this.jobs.push(
      new cron.CronJob('0 18 * * *', () => {
        this.sendOverdueNotifications();
      }, null, true, 'America/New_York')
    );

    // Clean up old verification tokens every day at midnight
    this.jobs.push(
      new cron.CronJob('0 0 * * *', () => {
        this.cleanupExpiredTokens();
      }, null, true, 'America/New_York')
    );

    console.log('Automation jobs initialized');
  }

  async checkOverdueBooks() {
    try {
      console.log('Checking for overdue books...');
      
      const overdueTransactions = await Transaction.findOverdue();
      
      for (const transaction of overdueTransactions) {
        // Update fine amount
        transaction.calculateFine();
        await transaction.save();

        // Send real-time notification
        if (this.io) {
          this.io.to(transaction.user._id.toString()).emit('bookOverdue', {
            message: `Book "${transaction.book.title}" is overdue`,
            transaction: transaction,
            fineAmount: transaction.fineAmount
          });
        }
      }

      console.log(`Found ${overdueTransactions.length} overdue books`);
    } catch (error) {
      console.error('Error checking overdue books:', error);
    }
  }

  async sendDueReminders() {
    try {
      console.log('Sending due reminders...');
      
      // Find books due in 2 days
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      
      const dueSoonTransactions = await Transaction.find({
        status: 'active',
        dueDate: {
          $gte: new Date(twoDaysFromNow.getTime() - 24 * 60 * 60 * 1000), // 1 day before
          $lte: twoDaysFromNow
        }
      }).populate('user book');

      for (const transaction of dueSoonTransactions) {
        try {
          // Send email reminder
          await sendBookDueReminder(
            transaction.user.email,
            transaction.user.firstName,
            transaction.book.title,
            transaction.dueDate
          );

          // Send SMS reminder
          await sendBookDueReminderSMS(
            transaction.user.phone,
            transaction.book.title,
            transaction.dueDate
          );

          console.log(`Reminder sent to ${transaction.user.email} for book "${transaction.book.title}"`);
        } catch (error) {
          console.error(`Failed to send reminder to ${transaction.user.email}:`, error);
        }
      }

      console.log(`Sent ${dueSoonTransactions.length} due reminders`);
    } catch (error) {
      console.error('Error sending due reminders:', error);
    }
  }

  async sendOverdueNotifications() {
    try {
      console.log('Sending overdue notifications...');
      
      const overdueTransactions = await Transaction.findOverdue();

      for (const transaction of overdueTransactions) {
        try {
          const daysOverdue = Math.ceil((new Date() - transaction.dueDate) / (1000 * 60 * 60 * 24));
          
          // Send email notification
          await sendOverdueNotification(
            transaction.user.email,
            transaction.user.firstName,
            transaction.book.title,
            daysOverdue,
            transaction.fineAmount
          );

          // Send SMS notification
          await sendOverdueNotificationSMS(
            transaction.user.phone,
            transaction.book.title,
            daysOverdue,
            transaction.fineAmount
          );

          console.log(`Overdue notification sent to ${transaction.user.email} for book "${transaction.book.title}"`);
        } catch (error) {
          console.error(`Failed to send overdue notification to ${transaction.user.email}:`, error);
        }
      }

      console.log(`Sent ${overdueTransactions.length} overdue notifications`);
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
    }
  }

  async cleanupExpiredTokens() {
    try {
      console.log('Cleaning up expired tokens...');
      
      const now = new Date();
      
      // Clean up expired email verification tokens
      await User.updateMany(
        {
          emailVerificationExpires: { $lt: now },
          isEmailVerified: false
        },
        {
          $unset: {
            emailVerificationToken: 1,
            emailVerificationExpires: 1
          }
        }
      );

      // Clean up expired phone verification tokens
      await User.updateMany(
        {
          phoneVerificationExpires: { $lt: now },
          isPhoneVerified: false
        },
        {
          $unset: {
            phoneVerificationToken: 1,
            phoneVerificationExpires: 1
          }
        }
      );

      // Clean up expired password reset tokens
      await User.updateMany(
        {
          passwordResetExpires: { $lt: now }
        },
        {
          $unset: {
            passwordResetToken: 1,
            passwordResetExpires: 1
          }
        }
      );

      console.log('Expired tokens cleaned up');
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }

  async generateMonthlyReport() {
    try {
      console.log('Generating monthly report...');
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const [
        newUsers,
        newBooks,
        totalTransactions,
        totalFines,
        popularBooks
      ] = await Promise.all([
        User.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }),
        Book.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }),
        Transaction.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }),
        Transaction.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              totalFines: { $sum: '$fineAmount' }
            }
          }
        ]),
        Book.find({ isActive: true })
          .sort({ borrowCount: -1 })
          .limit(10)
          .select('title author borrowCount')
      ]);

      const report = {
        period: {
          start: startOfMonth,
          end: endOfMonth
        },
        statistics: {
          newUsers,
          newBooks,
          totalTransactions,
          totalFines: totalFines.length > 0 ? totalFines[0].totalFines : 0
        },
        popularBooks
      };

      console.log('Monthly report generated:', report);
      return report;
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  async sendMonthlyReport() {
    try {
      const report = await this.generateMonthlyReport();
      
      // In a real implementation, you would send this report to administrators
      console.log('Monthly report would be sent to administrators:', report);
      
      return report;
    } catch (error) {
      console.error('Error sending monthly report:', error);
      throw error;
    }
  }

  stopAllJobs() {
    this.jobs.forEach(job => job.stop());
    console.log('All automation jobs stopped');
  }

  startAllJobs() {
    this.jobs.forEach(job => job.start());
    console.log('All automation jobs started');
  }
}

module.exports = AutomationService;
