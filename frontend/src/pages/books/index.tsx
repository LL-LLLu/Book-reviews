import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '@/lib/api';
import { Book } from '@/types';
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function BooksPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [author, setAuthor] = useState('');
  const [sort, setSort] = useState('newest');

  const { data, isLoading, error } = useQuery({
    queryKey: ['books', page, search, genre, author, sort],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(genre && { genre }),
        ...(author && { author }),
        sort,
      });
      const response = await api.get(`/books?${params}`);
      return response.data;
    },
  });

  const genres = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Thriller', 'Romance', 'Biography', 'History', 'Self-Help',
    'Poetry', 'Drama', 'Comedy', 'Horror', 'Adventure'
  ];

  const handleReset = () => {
    setSearch('');
    setGenre('');
    setAuthor('');
    setSort('newest');
    setPage(1);
  };

  return (
    <Layout>
      <Head>
        <title>Browse Books - Book Review Hub</title>
        <meta name="description" content="Browse and discover books" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-3">Browse Books</h1>
          <div className="w-16 h-1 bg-black dark:bg-white mb-8"></div>
          
          <div className="border border-gray-200 dark:border-gray-700 mb-8">
            <div className="p-8">
              <SearchBar onSearch={setSearch} placeholder="Search books by title, author, or description..." />
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  >
                    <option value="">All Genres</option>
                    {genres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Search by author..."
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Sort By</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  >
                    <option value="newest">Newest First</option>
                    <option value="rating">Highest Rated</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-3 border-2 border-black dark:border-white text-black dark:text-white font-bold tracking-wide uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-8 rounded-lg">
            <p className="text-lg font-medium">Error loading books</p>
            <p className="text-sm mt-2">Please try again later.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex justify-between items-center">
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Showing {data?.books.length || 0} of {data?.totalBooks || 0} books
              </p>
              <Link
                href="/books/add"
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Add New Book
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {data?.books.map((book: Book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>

            {data?.books.length === 0 && (
              <div className="text-center py-16 border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white mb-3">No Books Found</h2>
                <div className="w-12 h-1 bg-black dark:bg-white mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-500 mb-8">Try adjusting your search criteria or add a new book</p>
                <Link
                  href="/books/add"
                  className="inline-flex items-center px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Add First Book
                </Link>
              </div>
            )}

            {data && data.totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors font-medium uppercase tracking-wide"
                >
                  Previous
                </button>
                
                <div className="flex gap-1 mx-4">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(data.totalPages, page - 2 + i));
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-3 font-bold transition-colors ${
                          page === pageNum
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                  disabled={page === data.totalPages}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors font-medium uppercase tracking-wide"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}