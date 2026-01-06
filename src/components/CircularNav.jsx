'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import {
  Dashboard as DashboardIcon,
  Quiz as QuizIcon,
  AccountCircle as ProfileIcon,
  Code as CodeIcon,
  Description as ProjectIcon,
  Terminal as SolutionIcon,
  Event as EventIcon,
} from '@mui/icons-material';

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, href: '/coding-club/dashboard' },
  { label: 'Quiz', icon: <QuizIcon fontSize="small" />, href: '/coding-club/quiz' },
  { label: 'Profile', icon: <ProfileIcon fontSize="small" />, href: '/coding-club/profile' },
  { label: 'Snippets', icon: <CodeIcon fontSize="small" />, href: '/coding-club/code' },
  { label: 'Projects', icon: <ProjectIcon fontSize="small" />, href: '/coding-club/projects' },
  { label: 'Solutions', icon: <SolutionIcon fontSize="small" />, href: '/coding-club/solutions' },
  { label: 'Events', icon: <EventIcon fontSize="small" />, href: '/coding-club/events' },
];

export default function CircularNav({ onClose }) {
  const router = useRouter();

  useEffect(() => {
    const handler = e => {
      if (e.target.id === 'nav-overlay') onClose();
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  const radius = 80;

  return (
    <motion.div
      id="nav-overlay"
      className="fixed inset-0 z-50 bg-black bg-opacity-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute bottom-4 left-4 w-64 h-64 z-50 pointer-events-none">
        {/* Circular platform */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-full rounded-full bg-[#111] border-t-[6px] border-cyan-400 pointer-events-auto"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          {/* Circular button layout */}
          {navItems.map((item, i) => {
            const angle = Math.PI * (i / (navItems.length - 1)); // 0 to 180 degrees
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
              <motion.button
                key={item.href}
                className="absolute w-10 h-10 bg-cyan-500 text-black rounded-full flex items-center justify-center hover:bg-cyan-400 shadow-md"
                style={{
                  left: `calc(50% + ${x}px - 20px)`,
                  top: `calc(100% - ${y}px - 20px)`,
                }}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
              >
                {item.icon}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
