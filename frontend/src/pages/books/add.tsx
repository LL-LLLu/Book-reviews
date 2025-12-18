import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';

interface GoogleBook {
  googleId: string;
  title: string;
  author: string;
  description: string;
  isbn: string;
  coverImage: string;
  publisher: string;
  publicationDate: string;
  pageCount: number;
  language: string;
  genres: string[];
}

interface BookForm {
  title: string;
  author: string;
  description: string;
  isbn: string;
  coverImage: string;
  genres: string[];
  publisher: string;
  publicationDate: string;
  pageCount: number;
  language: string;
}

export default function AddBookPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<BookForm>({
    title: '',
    author: '',
    description: '',
    isbn: '',
    coverImage: '',
    genres: [],
    publisher: '',
    publicationDate: '',
    pageCount: 0,
    language: 'English'
  });

  const availableGenres = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Thriller', 'Romance', 'Biography', 'History', 'Self-Help',
    'Poetry', 'Drama', 'Comedy', 'Horror', 'Adventure'
  ];

  // Search Google Books
  const { data: googleBooks, isLoading: isSearching, refetch: searchBooks } = useQuery({
    queryKey: ['google-books', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { books: [] };
      const response = await api.get(`/books/search-google?query=${encodeURIComponent(searchQuery)}`);
      return response.data;
    },
    enabled: false
  });

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: async (data: BookForm | FormData) => {
      const response = await api.post('/books', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Book added successfully!');
      router.push('/books');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add book');
    }
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchBooks();
    }
  };

  const handleSelectBook = (book: GoogleBook) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description,
      isbn: book.isbn,
      coverImage: book.coverImage,
      genres: book.genres,
      publisher: book.publisher,
      publicationDate: book.publicationDate,
      pageCount: book.pageCount,
      language: book.language
    });
    setSelectedFile(null);
  };

  const handleInputChange = (field: keyof BookForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author || !formData.description || formData.genres.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedFile) {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('author', formData.author);
      data.append('description', formData.description);
      // Send genres as JSON string to handle array correctly in backend
      data.append('genres', JSON.stringify(formData.genres));
      
      if (formData.isbn) data.append('isbn', formData.isbn);
      if (formData.publisher) data.append('publisher', formData.publisher);
      if (formData.publicationDate) data.append('publicationDate', formData.publicationDate);
      if (formData.pageCount) data.append('pageCount', formData.pageCount.toString());
      if (formData.language) data.append('language', formData.language);
      
      // Append file
      data.append('coverImage', selectedFile);

      addBookMutation.mutate(data);
    } else {
      addBookMutation.mutate(formData);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Add New Book - Book Review Hub</title>
        <meta name="description" content="Add a new book to the collection" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <Link href="/books" className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors mb-8">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Books
          </Link>
          <h1 className="text-4xl font-bold text-black dark:text-white mb-3">Add New Book</h1>
          <div className="w-16 h-1 bg-black dark:bg-white mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Search for a book online or enter details manually</p>
        </div>

        {!isManualEntry && !selectedBook && (
          <div className="border border-gray-200 dark:border-gray-700 mb-12">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Search Online Database</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    onClick={() => setIsManualEntry(true)}
                    className="px-8 py-3 border-2 border-black dark:border-white text-black dark:text-white font-medium hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  >
                    Manual Entry
                  </button>
                </div>
              </div>
            </div>

            {googleBooks && googleBooks.books.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-xl font-bold text-black dark:text-white mb-6">Search Results</h3>
                <div className="space-y-6">
                  {googleBooks.books.map((book: GoogleBook) => (
                    <div key={book.googleId} className="flex gap-6 p-6 border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors">
                      {book.coverImage && (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-20 h-28 object-cover border border-gray-200 dark:border-gray-700"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-black dark:text-white mb-1">{book.title}</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">by {book.author}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 line-clamp-2">{book.description}</p>
                        <button
                          onClick={() => handleSelectBook(book)}
                          className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                        >
                          Select Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {googleBooks && googleBooks.books.length === 0 && searchQuery && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-500">No books found. Try a different search term or enter details manually.</p>
              </div>
            )}
          </div>
        )}

        {(isManualEntry || selectedBook) && (
          <div className="border border-gray-200 dark:border-gray-700">
            <div className="p-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-black dark:text-white">
                    {selectedBook ? 'Review Book Details' : 'Enter Book Details'}
                  </h2>
                  <div className="w-12 h-1 bg-black dark:bg-white mt-2"></div>
                </div>
                {selectedBook && (
                  <button
                    onClick={() => {
                      setSelectedBook(null);
                      setFormData({
                        title: '',
                        author: '',
                        description: '',
                        isbn: '',
                        coverImage: '',
                        genres: [],
                        publisher: '',
                        publicationDate: '',
                        pageCount: 0,
                        language: 'English'
                      });
                    }}
                    className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-8">

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                    Author *
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => handleInputChange('isbn', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange('publisher', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formData.publicationDate}
                    onChange={(e) => handleInputChange('publicationDate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                    Page Count
                  </label>
                  <input
                    type="number"
                    value={formData.pageCount || ''}
                    onChange={(e) => handleInputChange('pageCount', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                  Cover Image
                </label>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-center cursor-pointer hover:border-black dark:hover:border-white transition-colors">
                        <span className="text-gray-600 dark:text-gray-400">
                          {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to upload image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setSelectedFile(e.target.files[0]);
                              handleInputChange('coverImage', '');
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-sm">OR</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        value={formData.coverImage}
                        onChange={(e) => {
                          handleInputChange('coverImage', e.target.value);
                          setSelectedFile(null);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-4 tracking-wide uppercase">
                  Genres * (Select at least one)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableGenres.map((genre) => (
                    <label key={genre} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.genres.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                        className="mr-3 w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-900 checked:bg-black dark:checked:bg-white focus:outline-none transition-colors"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors font-medium">
                        {genre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={addBookMutation.isPending}
                  className="px-12 py-4 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addBookMutation.isPending ? 'Adding...' : 'Add Book'}
                </button>
                <Link
                  href="/books"
                  className="px-12 py-4 border-2 border-black dark:border-white text-black dark:text-white font-bold tracking-wide uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}