# Library Management System (LMS)

A comprehensive library management system built with Node.js, Express.js, MongoDB, React, and Redux Toolkit. This system provides complete functionality for managing books, users, transactions, and real-time notifications.

## 🚀 Features

### ✅ User Authentication & Security
- **Secure Login & Signup** using JWT (JSON Web Token)
- **Role-Based Authorization** - Admin & Member access levels
- **OTP Verification** - Secure account verification via Email & Phone (Twilio & NodeMailer)
- **Forgot & Reset Password** - Secure password recovery system
- **Password Hashing** with bcryptjs
- **Account Lockout** after failed login attempts

### ✅ Book Management
- **CRUD Operations** - Add, Edit, Delete, and Fetch Books with MongoDB
- **Advanced Search** - Search by title, author, ISBN, genre
- **Book Categories** - Fiction, Non-Fiction, Science Fiction, etc.
- **Inventory Management** - Track total and available copies
- **Book Statistics** - Popular books, borrowing trends

### ✅ Transaction System
- **Book Issuing & Returning** - Track borrowed books efficiently
- **Renewal System** - Allow book renewals (max 3 times)
- **Due Date Management** - Automatic due date calculation
- **Fine System** - Calculate fines for overdue books
- **Transaction History** - Complete borrowing history

### ✅ Admin Panel
- **User Management** - Manage books & users with full control
- **Dashboard Analytics** - System statistics and insights
- **Transaction Management** - Issue, return, and track books
- **Bulk Notifications** - Send notifications to all users
- **System Reports** - Generate monthly and analytics reports

### ✅ Real-Time Features
- **Real-Time Notifications** - Send email updates for issued books
- **Socket.io Integration** - Live updates for transactions
- **Email Notifications** - Due reminders, overdue alerts
- **SMS Notifications** - Twilio integration for phone alerts

### ✅ Automation
- **Automated Reminders** - Send due date reminders
- **Overdue Notifications** - Automatic overdue book alerts
- **Token Cleanup** - Remove expired verification tokens
- **Cron Jobs** - Scheduled tasks for maintenance

### ✅ Frontend Features
- **Responsive UI** - Fully functional frontend with Tailwind CSS
- **State Management** - Efficient and clean state management with Redux Toolkit
- **Modern Design** - Beautiful and intuitive user interface
- **Mobile Responsive** - Works on all device sizes

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **NodeMailer** - Email service
- **Twilio** - SMS service
- **Socket.io** - Real-time communication
- **Cron** - Job scheduling

### Frontend
- **React** - UI library
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications
- **Axios** - HTTP client

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/library_management

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d

   # Email Configuration (NodeMailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Frontend URL
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## 🚀 Usage

### Starting the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   npm run dev
   ```

3. **Start the frontend** (in a new terminal)
   ```bash
   cd client
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Default Admin Account

After setting up the database, you can create an admin account by registering with the role "admin" or by updating a user's role in the database.

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/verify-phone` - Verify phone
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create book (Admin)
- `PUT /api/books/:id` - Update book (Admin)
- `DELETE /api/books/:id` - Delete book (Admin)

### Transactions
- `POST /api/transactions/issue` - Issue book (Admin)
- `POST /api/transactions/return` - Return book (Admin)
- `POST /api/transactions/renew` - Renew book
- `GET /api/transactions` - Get all transactions (Admin)
- `GET /api/transactions/my-transactions` - Get user transactions

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password

### Admin
- `GET /api/admin/users` - Get all users (Admin)
- `GET /api/admin/dashboard` - Get dashboard data (Admin)
- `GET /api/admin/analytics` - Get analytics (Admin)

## 🔧 Configuration

### Email Setup (NodeMailer)
1. Use Gmail with App Password
2. Enable 2-factor authentication
3. Generate App Password
4. Update EMAIL_USER and EMAIL_PASS in .env

### SMS Setup (Twilio)
1. Create Twilio account
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Update Twilio credentials in .env

### Database Setup
1. Install MongoDB
2. Create database: `library_management`
3. Update MONGODB_URI in .env

## 🧪 Testing

### Backend Testing
```bash
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 📊 Features in Detail

### User Roles
- **Admin**: Full access to all features
- **Member**: Limited access to personal features

### Book Management
- Add books with detailed information
- Search and filter books
- Track availability
- Manage book categories and genres

### Transaction System
- Issue books to users
- Track due dates
- Handle renewals
- Calculate fines
- Send notifications

### Real-time Features
- Live notifications
- Real-time updates
- Socket.io integration

### Security Features
- JWT authentication
- Password hashing
- Account lockout
- Input validation
- Rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@librarymanagement.com or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Barcode scanning
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Integration with external libraries
- [ ] AI-powered book recommendations

---

**Built with ❤️ for modern library management**