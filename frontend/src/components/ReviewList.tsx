import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Review } from '@/types';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/image-utils';

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rating: 0, title: '', content: '' });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, data }: { reviewId: string; data: any }) => {
      const response = await api.put(`/reviews/${reviewId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Review updated successfully');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['book'] });
      setEditingReviewId(null);
    },
    onError: () => {
      toast.error('Failed to update review');
    }
  });

  // Upvote review mutation
  const upvoteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await api.post(`/reviews/${reviewId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['book'] });
    },
    onError: (error: any) => {
      // Only show error toast for actual errors (4xx and 5xx status codes)
      if (error.response?.status === 401) {
        toast.error('Please sign in to upvote reviews');
      } else if (error.response?.status >= 400) {
        const message = error.response?.data?.message;
        if (message && !message.includes('Server error')) {
          toast.error(message);
        } else if (error.response?.status >= 500) {
          toast.error('Something went wrong. Please try again.');
        } else {
          toast.error('Failed to upvote review');
        }
      }
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
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    updateReviewMutation.mutate({ reviewId, data: editForm });
  };

  const handleUpvote = (reviewId: string) => {
    if (!user) {
      toast.error('Please sign in to upvote reviews');
      return;
    }
    upvoteMutation.mutate(reviewId);
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
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
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

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No reviews yet. Be the first to review this book!
      </div>
    );
  }

  console.log('Reviews data:', reviews.map(r => ({ id: r._id, title: r.title })));

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <motion.div
          key={review._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
        >
          {editingReviewId === review._id ? (
            // Edit Mode
            <div>
              <div className="flex items-start gap-4 mb-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {review.user.avatar ? (
                    <Image
                      src={getImageUrl(review.user.avatar)!}
                      alt={review.user.username}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                      <span className="text-sm font-bold text-white dark:text-black">
                        {review.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Edit Form */}
                <div className="flex-1">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                    {renderStars(editForm.rating, true)}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review</label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUpdateSubmit(review._id)}
                      disabled={updateReviewMutation.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-rainbow-green to-rainbow-lime text-white rounded-lg hover:from-rainbow-lime hover:to-rainbow-green disabled:opacity-50 transition-all duration-200 shadow-md shadow-rainbow-green/30"
                    >
                      {updateReviewMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEditingReviewId(null)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {review.user.avatar ? (
                      <Image
                        src={getImageUrl(review.user.avatar)!}
                        alt={review.user.username}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                        <span className="text-sm font-bold text-white dark:text-black">
                          {review.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {renderStars(review.rating)}
                      <Link 
                        href={`/reviews/${review._id}`}
                        className="ml-3 font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {review.title}
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by <span className="font-medium">{review.user.username}</span> on{' '}
                      {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleUpvote(review._id)}
                    disabled={upvoteMutation.isPending || !user}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      user && review.upvotes?.includes(user._id)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="text-sm">{review.upvotes?.length || 0}</span>
                  </button>

                  {review.isVerifiedPurchase && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded border border-green-300 dark:border-green-600">
                      Verified Purchase
                    </span>
                  )}
                  {user && user._id === review.user._id && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditClick(review)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      title="Edit review"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </motion.button>
                  )}
                </div>
              </div>
              
              <div className="ml-16">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.content}</p>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{review.upvotes?.length || 0} upvotes</span>
                    <span>{review.comments?.length || 0} comments</span>
                    {review.updatedAt !== review.createdAt && (
                      <span className="text-xs italic">
                        (edited {format(new Date(review.updatedAt), 'MMM dd, yyyy')})
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/reviews/${review._id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    View Full Review
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}