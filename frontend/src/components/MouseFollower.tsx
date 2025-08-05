import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function MouseFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Precise pointer dot */}
      <motion.div
        className="fixed w-2 h-2 pointer-events-none z-[60] mix-blend-difference"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "tween",
          duration: 0,
        }}
      >
        <div className="w-full h-full bg-white rounded-full" />
      </motion.div>

      {/* Main book cursor */}
      <motion.div
        className="fixed w-8 h-8 pointer-events-none z-50"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          opacity: isVisible ? 1 : 0,
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          x: { type: "spring", damping: 30, stiffness: 500, mass: 0.2 },
          y: { type: "spring", damping: 30, stiffness: 500, mass: 0.2 },
          rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20V19.5C20 20.8807 18.8807 22 17.5 22H6.5C5.11929 22 4 20.8807 4 19.5Z"
            fill="url(#bookGradient)"
            stroke="white"
            strokeWidth="1"
          />
          <path
            d="M6.5 2C5.11929 2 4 3.11929 4 4.5V17H20V4.5C20 3.11929 18.8807 2 17.5 2H6.5Z"
            fill="url(#bookGradient2)"
            stroke="white"
            strokeWidth="1"
          />
          <path
            d="M4 17H20"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Add a small dot in the top-left corner to indicate the actual cursor position */}
          <circle cx="4" cy="4" r="1.5" fill="white" opacity="0.8" />
          <defs>
            <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9c27b0" />
              <stop offset="50%" stopColor="#e91e63" />
              <stop offset="100%" stopColor="#2196f3" />
            </linearGradient>
            <linearGradient id="bookGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4caf50" />
              <stop offset="50%" stopColor="#ffeb3b" />
              <stop offset="100%" stopColor="#ff9800" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Book pages trailing effect */}
      <motion.div
        className="fixed w-6 h-6 pointer-events-none z-40"
        animate={{
          x: mousePosition.x - 3,
          y: mousePosition.y - 3,
          opacity: isVisible ? 0.6 : 0,
        }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
          mass: 0.4,
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 2L20 2C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z"
            fill="rgba(156, 39, 176, 0.3)"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1"
          />
        </svg>
      </motion.div>

      {/* Small bookmark trailing effect */}
      <motion.div
        className="fixed w-4 h-4 pointer-events-none z-30"
        animate={{
          x: mousePosition.x - 2,
          y: mousePosition.y - 2,
          opacity: isVisible ? 0.4 : 0,
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 200,
          mass: 0.6,
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 2H19C19.5523 2 20 2.44772 20 3V22L12 18L4 22V3C4 2.44772 4.44772 2 5 2Z"
            fill="rgba(233, 30, 99, 0.4)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
          />
        </svg>
      </motion.div>
    </>
  );
}