import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/image-utils';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

interface Review {
  _id: string;
  title: string;
  content: string;
  rating: number;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  book: {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
  };
  upvotes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  // Fetch review data
  const { data: review, isLoading, error } = useQuery<Review>({
    queryKey: ['review', id],
    queryFn: async () => {
      console.log('Fetching review with ID:', id);
      try {
        const response = await api.get(`/reviews/${id}`);
        console.log('Review data received:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching review:', error);
        console.error('Error response:', error.response?.data);
        throw error;
      }
    },
    enabled: !!id
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/reviews/${id}/upvote`);
      return response.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['review', id] });

      // Snapshot the previous value
      const previousReview = queryClient.getQueryData(['review', id]);

      // Optimistically update to the new value
      if (previousReview && user) {
        queryClient.setQueryData(['review', id], (old: any) => {
          if (!old) return old;
          
          const currentUpvotes = old.upvotes || [];
          const isUpvoted = currentUpvotes.includes(user._id);
          
          return {
            ...old,
            upvotes: isUpvoted 
              ? currentUpvotes.filter((id: string) => id !== user._id)
              : [...currentUpvotes, user._id]
          };
        });
      }

      // Return a context object with the snapshotted value
      return { previousReview };
    },
    onSuccess: (data) => {
      // Update with actual server data
      queryClient.setQueryData(['review', id], data);
    },
    onError: (error: any, variables, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['review', id], context?.previousReview);
      
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
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have correct data
      queryClient.invalidateQueries({ queryKey: ['review', id] });
    }
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/reviews/${id}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Comment added successfully');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['review', id] });
    },
    onError: (error: any) => {
      if (error.response?.status === 401) {
        toast.error('Please sign in to add comments');
      } else if (error.response?.status >= 400) {
        const message = error.response?.data?.message;
        if (message && !message.includes('Server error')) {
          toast.error(message);
        } else if (error.response?.status >= 500) {
          toast.error('Something went wrong. Please try again.');
        } else {
          toast.error('Failed to add comment');
        }
      }
    }
  });

  const handleUpvote = () => {
    if (!user) {
      toast.error('Please sign in to upvote reviews');
      return;
    }
    upvoteMutation.mutate();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    commentMutation.mutate(newComment.trim());
  };

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;
  if (error || !review) return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Review Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The review you're looking for doesn't exist.</p>
          <Link href="/books" className="text-black dark:text-white hover:underline font-medium">
            Browse Books
          </Link>
        </div>
      </div>
    </Layout>
  );

  const isUpvoted = user && review.upvotes.includes(user._id);

  return (
    <Layout>
      <Head>
        <title>{review.title} - Book Review Hub</title>
        <meta name="description" content={review.content.substring(0, 160)} />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:underline transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </motion.div>

        {/* Book Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-6">
            {review.book.coverImage && (
              <Image
                src={getImageUrl(review.book.coverImage)!}
                alt={review.book.title}
                width={80}
                height={120}
                className="w-20 h-30 object-cover rounded-lg shadow-sm"
              />
            )}
            <div className="flex-1">
              <Link 
                href={`/books/${review.book._id}`}
                className="text-2xl font-bold text-gray-900 dark:text-white hover:underline transition-colors inline-block mb-1"
              >
                {review.book.title}
              </Link>
              <p className="text-lg text-gray-600 dark:text-gray-300">by {review.book.author}</p>
            </div>
          </div>
        </motion.div>

        {/* Review Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          {/* Review Header with User Info */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              {review.user.avatar ? (
                <Image
                  src={getImageUrl(review.user.avatar)!}
                  alt={review.user.username}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                  <span className="text-white dark:text-black font-bold">
                    {review.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div>
                <Link 
                  href={`/users/${review.user._id}`}
                  className="font-semibold text-gray-900 dark:text-white hover:underline transition-colors"
                >
                  {review.user.username}
                </Link>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-black dark:text-white fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Upvote Button */}
            <button
              onClick={handleUpvote}
              disabled={upvoteMutation.isPending || !user}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isUpvoted
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span>{review.upvotes.length}</span>
            </button>
          </div>

          {/* Review Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {review.title}
          </h1>

          {/* Separator Line */}
          <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-8"></div>

          {/* Review Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
              {review.content}
            </p>
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-gray-200 dark:border-gray-700 pt-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Comments ({review.comments.length})
          </h2>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-12">
              <div className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this review..."
                  className="w-full min-h-[120px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                  disabled={commentMutation.isPending}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || !newComment.trim()}
                    className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {commentMutation.isPending ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 mb-12">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Sign in to join the discussion
              </p>
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-8">
            {review.comments.map((comment) => (
              <div key={comment._id} className="flex items-start gap-4">
                {comment.user.avatar ? (
                  <Image
                    src={getImageUrl(comment.user.avatar)!}
                    alt={comment.user.username}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {comment.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {comment.user.username}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}

            {review.comments.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-5xl mb-3">💬</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No comments yet</p>
                <p className="text-gray-400 dark:text-gray-500">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}