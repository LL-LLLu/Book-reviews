import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Book } from '@/types';
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('newest');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['books', page, search, genre, sort],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(genre && { genre }),
        sort,
      });
      const response = await api.get(`/books?${params}`);
      return response.data;
    },
  });

  const genres = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Thriller', 'Romance', 'Biography', 'History', 'Self-Help'
  ];

  return (
    <Layout>
      <Head>
        <title>Book Review Hub - Discover Your Next Great Read</title>
        <meta name="description" content="Find and review your favorite books" />
      </Head>


      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-900">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 text-black dark:text-white">
                Discover
                <br />
                Your Next
                <br />
                Great Read
              </h1>
              <div className="w-24 h-2 bg-black dark:bg-white mx-auto mb-8"></div>
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Join thousands of book lovers sharing reviews, discovering hidden gems, 
              and building their perfect reading lists.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12"
            >
              <SearchBar onSearch={setSearch} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  rotateX: 5,
                  rotateY: 5,
                }}
                whileTap={{ scale: 0.95 }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - rect.width / 2;
                  const y = e.clientY - rect.top - rect.height / 2;
                  e.currentTarget.style.transform = `perspective(1000px) rotateX(${y / 10}deg) rotateY(${x / 10}deg) scale(1.05)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
                }}
              >
                <Link href="/books" className="inline-flex items-center px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Browse Books
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  rotateX: 5,
                  rotateY: 5,
                }}
                whileTap={{ scale: 0.95 }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - rect.width / 2;
                  const y = e.clientY - rect.top - rect.height / 2;
                  e.currentTarget.style.transform = `perspective(1000px) rotateX(${y / 10}deg) rotateY(${x / 10}deg) scale(1.05)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
                }}
              >
                <Link href="/books/add" className="inline-flex items-center px-8 py-4 border-2 border-black dark:border-white text-black dark:text-white font-bold tracking-wide uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 transform hover:-translate-y-1">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add a Book
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Books Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-black dark:text-white mb-3">Featured Books</h2>
            <div className="w-16 h-1 bg-black dark:bg-white mx-auto mb-6"></div>
            <p className="text-xl text-gray-500 dark:text-gray-400">Explore our curated collection of amazing reads</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-8 flex flex-wrap gap-4 justify-center"
          >
            <div className="relative">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="appearance-none px-6 py-3 pr-10 bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white transition-all duration-200 font-medium"
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none px-6 py-3 pr-10 bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white transition-all duration-200 font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rated</option>
                <option value="title">Title (A-Z)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </motion.div>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center text-red-600">
            Error loading books. Please try again later.
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {data?.books.map((book: Book, index: number) => (
                <BookCard key={book._id} book={book} index={index} />
              ))}
            </motion.div>

            {data?.books.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center py-20"
              >
                <div className="mb-6">
                  <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-gray-500 text-xl mb-4">No books found</p>
                <p className="text-gray-400">Try adjusting your search or browse all books</p>
              </motion.div>
            )}

            {data?.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="mt-12 flex justify-center gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-all duration-200 font-bold tracking-wide uppercase"
                >
                  ← Previous
                </motion.button>
                <div className="flex items-center px-6 py-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black font-bold tracking-wide uppercase">
                  Page {page} of {data.totalPages}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.totalPages}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-all duration-200 font-bold tracking-wide uppercase"
                >
                  Next →
                </motion.button>
              </motion.div>
            )}
          </>
        )}
        </div>
      </section>
    </Layout>
  );
}