# Book Review Hub

A modern full-stack web application for book enthusiasts to discover, review, and share their favorite books.

## Features

- **User Authentication**: Secure registration and login system
- **Book Catalog**: Browse and search through a comprehensive collection of books
- **Reviews & Ratings**: Write detailed reviews and rate books on a 5-star scale
- **Search & Filter**: Find books by title, author, genre, or description
- **Responsive Design**: Fully responsive UI that works on all devices
- **User Profiles**: Track your reviews and favorite genres

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **Rate Limiting** for API protection

### Frontend
- **Next.js** (React framework)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **Zustand** for state management
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd book-review-app
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Configuration

1. Backend configuration:
Create a `.env` file in the backend directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookreview
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

2. Frontend configuration:
The `.env.local` file is already configured with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Running the Application

1. Start MongoDB (if running locally):
```bash
mongod
```

2. Start the backend server:
```bash
cd backend
npm run dev
```

3. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Books
- `GET /api/books` - Get all books (with pagination and filters)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Add new book (authenticated)
- `PUT /api/books/:id` - Update book (admin only)
- `DELETE /api/books/:id` - Delete book (admin only)
- `GET /api/books/:id/reviews` - Get book reviews

### Reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/like` - Like/unlike review
- `GET /api/reviews/user/:userId` - Get user's reviews

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user profile
- `DELETE /api/users/:id` - Delete user (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)

## Project Structure

```
book-review-app/
├── backend/
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── controllers/    # Route controllers
│   └── server.js       # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/      # Next.js pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities and API client
│   │   ├── hooks/      # Custom React hooks
│   │   ├── types/      # TypeScript types
│   │   └── styles/     # Global styles
│   └── public/         # Static assets
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.