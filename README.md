# HabitVault

A modern, full-stack habit tracking application designed to help users build and maintain positive habits through daily tracking, streaks, and achievement milestones.

## ✨ Features

- 📝 Create and manage daily habits
- ✅ Track daily completions and streaks
- 📊 Visual progress tracking and analytics
- 🎯 Custom scheduling (daily, weekdays, or specific days)
- 🏆 Achievement milestones and perfect day tracking
- 🌓 Dark/Light mode support
- 📱 Responsive design for all devices

## 🛠️ Tech Stack

### Frontend!

- React 18 with TypeScript
- TailwindCSS for styling
- Radix UI components
- React Query for data fetching

### Backend
- Flask (Python) for core business logic
- Express.js as proxy server
- JWT authentication
- PostgreSQL with SQLAlchemy ORM
- RESTful API design

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.11+)
- PostgreSQL

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/habitvault.git
cd habitvault
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Create .env file
cp .env.example .env

# Update with your values
DATABASE_URL=postgresql://localhost/habitvault
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
```

5. Initialize the database:
```bash
flask db upgrade
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

This will start both the Express proxy server and Flask backend.

2. Visit `http://localhost:5000` in your browser

## 📱 Usage

1. **Create an Account**: Sign up with your email and password
2. **Add Habits**: Click the "Add Habit" button to create new habits
3. **Daily Check-in**: Mark habits as complete on your dashboard
4. **Track Progress**: View your streaks and perfect days
5. **Customize**: Set habit schedules and manage preferences

## 🏗️ Project Structure

```
habitvault/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
├── server/                # Express proxy server
│   └── routes.ts         # API routes and proxy setup
├── backend/              # Flask backend
│   ├── models.py        # Database models
│   ├── app.py          # Flask application
│   └── config.py       # Configuration
└── shared/              # Shared types and utilities
```

## 🔒 Security

- JWT-based authentication
- Password hashing with secure algorithms
- CORS protection
- Input validation and sanitization
- Secure session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

--
Built with ❤️ using React, Flask, and PostgreSQL
