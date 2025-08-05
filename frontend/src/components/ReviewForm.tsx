import { useForm } from 'react-hook-form';

interface ReviewFormData {
  rating: number;
  title: string;
  content: string;
}

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ReviewForm({ onSubmit, onCancel, isLoading }: ReviewFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReviewFormData>({
    defaultValues: {
      rating: 5,
    },
  });

  const rating = watch('rating');

  return (
    <div className="bg-white dark:bg-gray-900 p-8 border-2 border-gray-200 dark:border-gray-700">
      <h3 className="text-2xl font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Write Your Review</h3>
      <div className="w-12 h-1 bg-black dark:bg-white mb-6"></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Rating</label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('rating', value)}
                className="focus:outline-none"
              >
                <svg
                  className={`w-8 h-8 transition-colors ${value <= rating ? 'text-black dark:text-white fill-current' : 'text-gray-300 dark:text-gray-600 stroke-current'}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
            Review Title
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            type="text"
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            placeholder="Sum up your review in a sentence"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
            Your Review
          </label>
          <textarea
            {...register('content', { 
              required: 'Review content is required',
              minLength: { value: 10, message: 'Review must be at least 10 characters' }
            })}
            rows={6}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
            placeholder="Share your thoughts about this book..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        <div className="flex space-x-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border-2 border-gray-300 dark:border-gray-600 text-black dark:text-white px-8 py-3 font-bold tracking-wide uppercase hover:border-black dark:hover:border-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}