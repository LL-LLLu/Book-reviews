import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Book } from '@/types';
import { useState } from 'react';

interface BookCardProps {
  book: Book;
  index?: number;
}

export default function BookCard({ book, index = 0 }: BookCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-black dark:text-white fill-current' 
                : 'text-gray-300 dark:text-gray-600 fill-current'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
      className="h-full"
    >
      <Link href={`/books/${book._id}`}>
        <motion.div 
          className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white overflow-hidden h-full cursor-pointer group relative transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* Book cover */}
          <div className="relative h-72 overflow-hidden bg-gray-100 dark:bg-gray-800">
            {book.coverImage ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                )}
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  className={`object-cover transition-all duration-700 group-hover:scale-110 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoadingComplete={() => setImageLoaded(true)}
                />
              </>
            ) : (
              <div className="w-full h-full bg-black dark:bg-white flex items-center justify-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <svg className="w-24 h-24 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </motion.div>
              </div>
            )}
            
            {/* Quick view button on hover */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 group-hover:opacity-100"
            >
              <span className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-bold tracking-wide uppercase whitespace-nowrap border-2 border-black dark:border-white">
                Quick View →
              </span>
            </motion.div>
          </div>

          {/* Book details */}
          <div className="p-5">
            {/* Title and author */}
            <h3 className="text-lg font-bold text-black dark:text-white mb-1 line-clamp-1 group-hover:underline transition-all duration-300">
              {book.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">by {book.author}</p>

            {/* Rating and reviews */}
            <div className="flex items-center gap-2 mb-3">
              {renderStars(book.averageRating)}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {book.averageRating.toFixed(1)} ({book.ratingsCount} reviews)
              </span>
            </div>

            {/* Genres */}
            {book.genres && book.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.genres.slice(0, 2).map((genre, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-0.5 text-xs font-bold bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white uppercase tracking-wide"
                  >
                    {genre}
                  </span>
                ))}
                {book.genres.length > 2 && (
                  <span className="text-xs text-gray-500 font-medium">
                    +{book.genres.length - 2} more
                  </span>
                )}
              </div>
            )}

            {/* Hover effect: description preview */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              whileHover={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                {book.description}
              </p>
            </motion.div>
          </div>

          {/* Minimalist bookmark ribbon */}
          <div className="absolute top-0 right-4 w-8 h-12 bg-black dark:bg-white">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black dark:border-t-white"></div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}