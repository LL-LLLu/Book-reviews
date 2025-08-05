import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  initialX: number;
  initialY: number;
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const colors = [
    'bg-rainbow-red',
    'bg-rainbow-orange', 
    'bg-rainbow-yellow',
    'bg-rainbow-green',
    'bg-rainbow-blue',
    'bg-rainbow-indigo',
    'bg-rainbow-purple',
    'bg-rainbow-pink',
  ];

  useEffect(() => {
    // Initialize particles
    const initialParticles: Particle[] = Array.from({ length: 15 }, (_, i) => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      return {
        id: i,
        x,
        y,
        initialX: x,
        initialY: y,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
    
    setParticles(initialParticles);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {particles.map((particle) => {
        // Calculate distance from mouse to particle
        const dx = mousePosition.x - particle.x;
        const dy = mousePosition.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;
        
        // Calculate magnetic attraction/repulsion effect
        const magneticStrength = Math.max(0, (maxDistance - distance) / maxDistance);
        const magneticX = distance > 0 ? (dx / distance) * magneticStrength * 80 : 0;
        const magneticY = distance > 0 ? (dy / distance) * magneticStrength * 80 : 0;

        return (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${particle.color} opacity-30 mix-blend-multiply dark:mix-blend-screen`}
            style={{
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              x: particle.initialX + magneticX,
              y: particle.initialY + magneticY,
              scale: distance < 100 ? [1, 1.5, 1] : [1, 1.1, 1],
              rotate: [0, 360],
            }}
            transition={{
              x: { type: "spring", damping: 25, stiffness: 200 },
              y: { type: "spring", damping: 25, stiffness: 200 },
              scale: {
                duration: distance < 100 ? 0.5 : 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              },
              rotate: {
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          />
        );
      })}
    </div>
  );
}