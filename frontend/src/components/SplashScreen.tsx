import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Check if dark mode is enabled
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && systemPrefersDark));
  }, []);

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 30);

    // Complete after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400);
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* Subtle gradient overlay */}
          <div className={`absolute inset-0 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
              : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
          }`} />

          {/* Main content */}
          <div className="relative z-10 text-center">
            {/* Minimalist book icon */}
            <motion.div
              className="inline-block mb-12"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <svg
                className={`w-16 h-16 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </svg>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className={`text-2xl font-bold tracking-wide uppercase ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Book Review Hub
              </h1>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-16 w-48 mx-auto"
            >
              <div className={`h-0.5 overflow-hidden rounded-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}>
                <motion.div
                  className={`h-full ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-gray-600 to-gray-400' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-600'
                  }`}
                  style={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>

            {/* Subtle loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex justify-center space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                  }`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Corner accent */}
          <motion.div
            className="absolute bottom-0 left-0"
            initial={{ opacity: 0, x: -50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className={`w-32 h-32 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 to-transparent' 
                : 'bg-gradient-to-br from-gray-100 to-transparent'
            } rounded-tr-full opacity-50`} />
          </motion.div>
          
          <motion.div
            className="absolute top-0 right-0"
            initial={{ opacity: 0, x: 50, y: -50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className={`w-32 h-32 ${
              isDarkMode 
                ? 'bg-gradient-to-bl from-gray-800 to-transparent' 
                : 'bg-gradient-to-bl from-gray-100 to-transparent'
            } rounded-bl-full opacity-50`} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}