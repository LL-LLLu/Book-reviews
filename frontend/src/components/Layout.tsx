import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUrl } from '@/lib/image-utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout, checkAuth } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navVariants = {
    initial: { y: -100 },
    animate: { y: 0 }
  };

  const linkVariants = {
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const mobileMenuVariants = {
    closed: { 
      opacity: 0, 
      height: 0
    },
    open: { 
      opacity: 1, 
      height: 'auto'
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <motion.nav
        variants={navVariants}
        initial="initial"
        animate="animate"
        transition={{
          duration: 0.6,
          ease: "easeOut"
        }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
            : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-100/50 dark:border-gray-800/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center min-w-0 flex-shrink">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/" className="flex items-center space-x-1 md:space-x-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-black dark:text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </motion.div>
                  <span className="text-lg md:text-xl lg:text-2xl font-bold text-black dark:text-white tracking-wide truncate">
                    <span className="hidden sm:inline">BOOK REVIEW HUB</span>
                    <span className="sm:hidden">BOOKS</span>
                  </span>
                </Link>
              </motion.div>

              {/* Desktop Navigation - Show only on larger screens */}
              <div className="hidden lg:ml-6 xl:ml-10 lg:flex lg:items-center lg:space-x-4 xl:space-x-8">
                <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
                  <Link href="/books" className="text-black dark:text-white font-bold tracking-wide uppercase text-sm px-4 py-2 border-2 border-transparent hover:border-black dark:hover:border-white transition-colors">
                    Browse Books
                  </Link>
                </motion.div>
                {user && (
                  <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
                    <Link href="/books/add" className="text-black dark:text-white font-bold tracking-wide uppercase text-sm px-4 py-2 border-2 border-transparent hover:border-black dark:hover:border-white transition-colors">
                      Add Book
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 text-black dark:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </motion.button>
              
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
                      <Link href="/admin" className="text-black dark:text-white font-bold tracking-wide uppercase text-sm px-4 py-2 border-2 border-transparent hover:border-black dark:hover:border-white transition-colors">
                        Admin
                      </Link>
                    </motion.div>
                  )}
                  <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
                    <Link href="/profile" className="flex items-center gap-2 text-black dark:text-white font-bold tracking-wide uppercase text-sm px-4 py-2 border-2 border-transparent hover:border-black dark:hover:border-white transition-colors">
                      {user.avatar ? (
                        <Image
                          src={getImageUrl(user.avatar) || ''}
                          alt={user.username}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                          <span className="text-xs font-bold text-white dark:text-black">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="truncate max-w-24">{user.username}</span>
                    </Link>
                  </motion.div>
                  <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
                    <Link href="/settings" className="text-black dark:text-white font-bold tracking-wide uppercase text-sm px-4 py-2 border-2 border-transparent hover:border-black dark:hover:border-white transition-colors">
                      Settings
                    </Link>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="px-4 py-2 border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 font-bold tracking-wide uppercase text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div variants={linkVariants} whileHover="hover" whileTap="tap">
                    <Link href="/login" className="text-black dark:text-white font-bold tracking-wide uppercase text-sm px-4 py-2 border-2 border-transparent hover:border-black dark:hover:border-white transition-colors">
                      Login
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href="/register" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 font-bold tracking-wide uppercase text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                      Sign Up
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 p-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                variants={mobileMenuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {/* Dark Mode Toggle for Mobile */}
                  <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg text-sm font-medium"
                  >
                    <span>Dark Mode</span>
                    {isDarkMode ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <Link href="/books" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg text-sm font-medium">
                    Browse Books
                  </Link>
                  {user && (
                    <Link href="/books/add" className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium">
                      Add Book
                    </Link>
                  )}
                  {user ? (
                    <>
                      {user.role === 'admin' && (
                        <Link href="/admin" className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium">
                          Admin
                        </Link>
                      )}
                      <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium">
                        {user.avatar ? (
                          <Image
                            src={getImageUrl(user.avatar) || ''}
                            alt={user.username}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center border border-gray-200">
                            <span className="text-xs font-bold text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span>Profile</span>
                      </Link>
                      <Link href="/settings" className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium">
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium">
                        Login
                      </Link>
                      <Link href="/register" className="block px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white dark:bg-gray-900 border-t-2 border-black dark:border-white text-gray-600 dark:text-gray-300 mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2 tracking-wide uppercase">Book Review Hub</h3>
              <div className="w-12 h-1 bg-black dark:bg-white mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Discover your next great read and share your thoughts with fellow book lovers.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-black dark:text-white mb-2 tracking-wide uppercase">Quick Links</h4>
              <div className="w-8 h-1 bg-black dark:bg-white mb-4"></div>
              <div className="space-y-2">
                <Link href="/books" className="block text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors font-medium">
                  Browse Books
                </Link>
                <Link href="/books/add" className="block text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Add Book
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold text-black dark:text-white mb-2 tracking-wide uppercase">Contact</h4>
              <div className="w-8 h-1 bg-black dark:bg-white mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Built with passion for book enthusiasts
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-500 dark:text-gray-500">&copy; 2024 Book Review Hub. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}