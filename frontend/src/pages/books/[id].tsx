import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import Image from 'next/image';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Book, Review } from '@/types';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const response = await api.get(`/books/${id}`);
      return response.data.book as Book;
    },
    enabled: !!id,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const response = await api.get(`/books/${id}/reviews`);
      return response.data;
    },
    enabled: !!id,
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; title: string; content: string }) => {
      const response = await api.post('/reviews', {
        book: id,
        ...data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      setShowReviewForm(false);
      toast.success('Review added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add review');
    },
  });

  if (bookLoading || reviewsLoading) return <Layout><LoadingSpinner /></Layout>;
  if (!book) return <Layout><div>Book not found</div></Layout>;

  const hasReviewed = reviews?.reviews.some((r: Review) => r.user._id === user?._id);

  return (
    <Layout>
      <Head>
        <title>{book.title} - Book Review Hub</title>
        <meta name="description" content={book.description} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {book.coverImage ? (
              <Image
                src={book.coverImage}
                alt={book.title}
                width={400}
                height={600}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">No Cover</span>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <h1 className="text-4xl font-bold text-black dark:text-white mb-3 tracking-wide">{book.title}</h1>
            <div className="w-16 h-1 bg-black dark:bg-white mb-6"></div>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-6 font-medium">by {book.author}</p>

            <div className="flex items-center mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-6 h-6 ${i < Math.floor(book.averageRating) ? 'text-black dark:text-white fill-current' : 'text-gray-300 dark:text-gray-600 stroke-current'}`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="ml-3 text-lg font-medium text-black dark:text-white">
                {book.averageRating.toFixed(1)} ({book.ratingsCount} reviews)
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Description</h2>
              <div className="w-12 h-1 bg-black dark:bg-white mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{book.description}</p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h3 className="text-lg font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Book Details</h3>
              <div className="w-8 h-1 bg-black dark:bg-white mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex">
                  <span className="font-bold text-black dark:text-white w-24 tracking-wide uppercase text-sm">ISBN:</span>
                  <span className="text-gray-600 dark:text-gray-400">{book.isbn || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-black dark:text-white w-24 tracking-wide uppercase text-sm">Publisher:</span>
                  <span className="text-gray-600 dark:text-gray-400">{book.publisher || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-black dark:text-white w-24 tracking-wide uppercase text-sm">Published:</span>
                  <span className="text-gray-600 dark:text-gray-400">{book.publicationDate ? format(new Date(book.publicationDate), 'MMM dd, yyyy') : 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-black dark:text-white w-24 tracking-wide uppercase text-sm">Pages:</span>
                  <span className="text-gray-600 dark:text-gray-400">{book.pageCount || 'N/A'}</span>
                </div>
                <div className="flex md:col-span-2">
                  <span className="font-bold text-black dark:text-white w-24 tracking-wide uppercase text-sm">Language:</span>
                  <span className="text-gray-600 dark:text-gray-400">{book.language}</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Genres</h3>
              <div className="w-8 h-1 bg-black dark:bg-white mb-4"></div>
              <div className="flex flex-wrap gap-3">
                {book.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-bold tracking-wide uppercase border-2 border-black dark:border-white"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {user && !hasReviewed && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>
        </div>

        {showReviewForm && (
          <div className="mt-8">
            <ReviewForm
              onSubmit={(data) => createReviewMutation.mutate(data)}
              onCancel={() => setShowReviewForm(false)}
              isLoading={createReviewMutation.isPending}
            />
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Reviews</h2>
          <div className="w-16 h-1 bg-black dark:bg-white mb-8"></div>
          <ReviewList reviews={reviews?.reviews || []} />
        </div>
      </div>
    </Layout>
  );
}