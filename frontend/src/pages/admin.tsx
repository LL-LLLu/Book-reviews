import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Book, Review, User } from '@/types';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'books' | 'reviews' | 'users'>('books');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Check if user is admin
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data.user;
    }
  });

  // Fetch books
  const { data: booksData, isLoading: loadingBooks } = useQuery({
    queryKey: ['admin-books'],
    queryFn: async () => {
      const response = await api.get('/books?limit=50');
      return response.data;
    },
    enabled: activeTab === 'books'
  });

  // Fetch reviews
  const { data: reviewsData, isLoading: loadingReviews } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const response = await api.get('/reviews?limit=50');
      return response.data;
    },
    enabled: activeTab === 'reviews'
  });

  // Fetch users
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: activeTab === 'users'
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await api.delete(`/books/${bookId}`);
    },
    onSuccess: () => {
      toast.success('Book deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      setSelectedItems([]);
    },
    onError: () => {
      toast.error('Failed to delete book');
    }
  });

  // Delete review mutation (admin)
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await api.delete(`/reviews/${reviewId}/admin`);
    },
    onSuccess: () => {
      toast.success('Review deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedItems([]);
    },
    onError: () => {
      toast.error('Failed to delete review');
    }
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.put(`/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('Failed to update user role');
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  // Check if user is admin
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You don't have permission to access this page.</p>
            <Link href="/" className="text-primary-600 hover:text-primary-700">
              Go back to home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (items: any[]) => {
    const allIds = items.map(item => item._id);
    setSelectedItems(prev => 
      prev.length === allIds.length ? [] : allIds
    );
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedItems.length} ${activeTab}?`;
    if (!confirm(confirmMessage)) return;

    selectedItems.forEach(id => {
      if (activeTab === 'books') {
        deleteBookMutation.mutate(id);
      } else if (activeTab === 'reviews') {
        deleteReviewMutation.mutate(id);
      }
    });
  };

  return (
    <Layout>
      <Head>
        <title>Admin Dashboard - Book Review Hub</title>
        <meta name="description" content="Admin dashboard for managing books, reviews, and users" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage books, reviews, and users</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Books</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{booksData?.totalBooks || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">In the library</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Reviews</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{reviewsData?.totalReviews || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">User reviews</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{usersData?.users?.length || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {usersData?.users?.filter((u: User) => u.role === 'admin').length || 0} admins
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'books', label: 'Books', count: booksData?.totalBooks },
              { id: 'reviews', label: 'Reviews', count: reviewsData?.totalReviews },
              { id: 'users', label: 'Users', count: usersData?.users?.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedItems([]);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Selected ({selectedItems.length})
                  </button>
                )}
              </div>
              <Link
                href="/books/add"
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Add New Book
              </Link>
            </div>

            {loadingBooks ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === booksData?.books.length}
                      onChange={() => handleSelectAll(booksData?.books || [])}
                      className="mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">Select All</span>
                  </label>
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {booksData?.books.map((book: Book) => (
                    <li key={book._id}>
                      <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(book._id)}
                            onChange={() => handleSelectItem(book._id)}
                            className="mr-4"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{book.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300">by {book.author}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Added by {book.addedBy?.username || 'Unknown'} • {book.ratingsCount || 0} reviews
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/books/${book._id}`}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => deleteBookMutation.mutate(book._id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              {selectedItems.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Selected ({selectedItems.length})
                </button>
              )}
            </div>

            {loadingReviews ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === reviewsData?.reviews.length}
                      onChange={() => handleSelectAll(reviewsData?.reviews || [])}
                      className="mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">Select All</span>
                  </label>
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {reviewsData?.reviews.map((review: Review) => (
                    <li key={review._id}>
                      <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(review._id)}
                            onChange={() => handleSelectItem(review._id)}
                            className="mr-4"
                          />
                          {/* User Avatar */}
                          <div className="flex-shrink-0 mr-4">
                            {review.user.avatar ? (
                              <Image
                                src={review.user.avatar?.startsWith('http') ? review.user.avatar : `${process.env.NEXT_PUBLIC_BASE_URL}${review.user.avatar}`}
                                alt={review.user.username}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                              />
                                                                  
                            ) : (
                              <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                                <span className="text-sm font-bold text-white dark:text-black">
                                  {review.user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{review.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                by <span className="font-medium">{review.user.username}</span> ({review.user.email})
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              <span className="font-medium">Book:</span> {typeof review.book === 'object' ? `${review.book.title} by ${review.book.author}` : 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              {review.content}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Posted: {new Date(review.createdAt).toLocaleString()} • Likes: {review.likes?.length || 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteReviewMutation.mutate(review._id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {loadingUsers ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {usersData?.users.map((user: User) => (
                    <li key={user._id}>
                      <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.username}</h3>
                          <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                            {user.role === 'admin' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRoleMutation.mutate({ 
                              userId: user._id, 
                              role: e.target.value 
                            })}
                            disabled={user.role === 'admin' && usersData?.users.filter((u: User) => u.role === 'admin').length === 1}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete user ${user.username}? This will also delete all their reviews.`)) {
                                  deleteUserMutation.mutate(user._id);
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}