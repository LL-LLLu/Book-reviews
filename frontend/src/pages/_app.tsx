import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SplashScreen from '@/components/SplashScreen'
import PasswordSetupWrapper from '@/components/PasswordSetupWrapper'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  const [showSplash, setShowSplash] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Always show splash screen on initial load
    setShowSplash(true)
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AnimatePresence mode="wait">
            {showSplash && (
              <SplashScreen onComplete={handleSplashComplete} />
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {!showSplash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <PasswordSetupWrapper>
                  <Component {...pageProps} />
                </PasswordSetupWrapper>
              </motion.div>
            )}
          </AnimatePresence>

        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                background: '#065f46',
                color: '#ffffff',
                border: '1px solid #10b981',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: '#7f1d1d',
                color: '#ffffff',
                border: '1px solid #ef4444',
              },
            },
          }}
        />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}