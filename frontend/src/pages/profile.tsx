import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Review } from '@/types';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/image-utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rating: 0, title: '', content: '' });

  // Fetch user's reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['user-reviews', user?._id, page],
    queryFn: async () => {
      if (!user) return null;
      const response = await api.get(`/reviews/user/${user._id}?page=${page}&limit=10`);
      return response.data;
    },
    enabled: !!user
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await api.delete(`/reviews/${reviewId}`);
    },
    onSuccess: () => {
      toast.success('Review deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
    },
    onError: () => {
      toast.error('Failed to delete review');
    }
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, data }: { reviewId: string; data: any }) => {
      const response = await api.put(`/reviews/${reviewId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Review updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      setEditingReviewId(null);
    },
    onError: () => {
      toast.error('Failed to update review');
    }
  });

  const handleEditClick = (review: Review) => {
    setEditingReviewId(review._id);
    setEditForm({
      rating: review.rating,
      title: review.title,
      content: review.content
    });
  };

  const handleUpdateSubmit = (reviewId: string) => {
    updateReviewMutation.mutate({ reviewId, data: editForm });
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setEditForm({ ...editForm, rating: star })}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">Please login to view your profile.</p>
            <Link href="/login" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
              Go to Login
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>My Profile - Book Review Hub</title>
        <meta name="description" content="View your profile and reviews" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {user.avatar ? (
                <Image
                  src={getImageUrl(user.avatar) || ''}
                  alt={user.username}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                  <span className="text-3xl font-bold text-white dark:text-black">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.username}</h1>
                <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                {user.bio && (
                  <p className="text-gray-700 dark:text-gray-200 mt-1">{user.bio}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 mt-2">
                    Admin
                  </span>
                )}
                {user.favoriteGenres && user.favoriteGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.favoriteGenres.slice(0, 3).map((genre: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300">
                        {genre}
                      </span>
                    ))}
                    {user.favoriteGenres.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">+{user.favoriteGenres.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Reviews</h2>

          {isLoading ? (
            <LoadingSpinner />
          ) : reviewsData?.reviews.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">No reviews yet</p>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Start reviewing books to see them here!</p>
              <Link
                href="/books"
                className="inline-flex items-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {reviewsData?.reviews.map((review: Review) => (
                <div key={review._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  {editingReviewId === review._id ? (
                    // Edit Mode
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        {review.book && typeof review.book !== 'string' && review.book.coverImage && (
                          <Image
                            src={review.book.coverImage}
                            alt={review.book.title}
                            width={80}
                            height={120}
                            className="rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {review.book && typeof review.book !== 'string' ? review.book.title : 'Unknown Book'}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            by {review.book && typeof review.book !== 'string' ? review.book.author : 'Unknown Author'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                          {renderStars(editForm.rating, true)}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Review</label>
                          <textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateSubmit(review._id)}
                            disabled={updateReviewMutation.isPending}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                          >
                            {updateReviewMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => setEditingReviewId(null)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex items-start gap-4">
                        {review.book && typeof review.book !== 'string' && review.book.coverImage && (
                          <Link href={`/books/${review.book._id}`}>
                            <Image
                              src={review.book.coverImage}
                              alt={review.book.title}
                              width={80}
                              height={120}
                              className="rounded object-cover cursor-pointer hover:opacity-90"
                            />
                          </Link>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link
                                href={`/books/${typeof review.book === 'string' ? review.book : review.book._id}`}
                                className="text-lg font-semibold hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                              >
                                {review.book && typeof review.book !== 'string' ? review.book.title : 'Unknown Book'}
                              </Link>
                              <p className="text-gray-600 dark:text-gray-300">
                                by {review.book && typeof review.book !== 'string' ? review.book.author : 'Unknown Author'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditClick(review)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this review?')) {
                                    deleteReviewMutation.mutate(review._id);
                                  }
                                }}
                                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="mt-2">
                            {renderStars(review.rating)}
                          </div>

                          <h4 className="font-medium text-gray-900 dark:text-white mt-2">{review.title}</h4>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">{review.content}</p>

                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{review.likes.length} likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {reviewsData && reviewsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    Page {page} of {reviewsData.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(reviewsData.totalPages, page + 1))}
                    disabled={page === reviewsData.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}