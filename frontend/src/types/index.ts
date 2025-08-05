export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  description: string;
  coverImage?: string;
  genres: string[];
  publicationDate?: string;
  publisher?: string;
  pageCount?: number;
  language: string;
  averageRating: number;
  ratingsCount: number;
  addedBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface Review {
  _id: string;
  book: string | Book;
  user: {
    _id: string;
    username: string;
    email?: string; // Added for admin views
    avatar?: string;
  };
  rating: number;
  title: string;
  content: string;
  likes: string[]; // Keeping for backward compatibility
  upvotes: string[];
  comments: Comment[];
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  bio?: string;
  favoriteGenres?: string[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  [key: string]: T[] | number;
  currentPage: number;
  totalPages: number;
  total: number;
}