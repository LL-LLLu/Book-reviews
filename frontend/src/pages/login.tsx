import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import Layout from '@/components/Layout';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const { login, googleSignIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  // Handle authentication errors from URL parameters
  useEffect(() => {
    const { error } = router.query;
    if (error) {
      switch (error) {
        case 'UserExists':
          toast.error('This Google account is already registered. Please use "Sign in with Google" below to access your account.');
          break;
        case 'InvalidData':
          toast.error('Invalid account data. Please try again.');
          break;
        case 'AuthenticationFailed':
          toast.error('Authentication failed. Please try again.');
          break;
        case 'NetworkError':
          toast.error('Network error. Please check your connection and try again.');
          break;
        default:
          toast.error('An error occurred during sign-in. Please try again.');
      }
      // Clear the error from URL
      router.replace('/login', undefined, { shallow: true });
    }
  }, [router]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await googleSignIn();
      toast.success('Welcome back!');
      router.push('/');
    } catch (error: any) {
      toast.error('Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-black dark:text-white mb-3">Sign In</h1>
            <div className="w-16 h-1 bg-black dark:bg-white mx-auto mb-6"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link href="/register" className="text-black dark:text-white hover:underline font-medium">
                create a new account
              </Link>
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700">
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                    Email Address
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    autoComplete="email"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                    Password
                  </label>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    type="password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    placeholder="Enter your password"
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </motion.button>
                </div>
              </form>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 uppercase tracking-wide font-medium">
                  Or continue with
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full px-8 py-4 border-2 border-black dark:border-white text-black dark:text-white font-bold tracking-wide uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isGoogleLoading ? 'Signing In...' : 'Sign In with Google'}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}