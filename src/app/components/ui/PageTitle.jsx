'use client';

import { motion } from 'framer-motion';

export default function PageTitle({ children, level = 'h1' }) {
  const Tag = level;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Tag className="text-3xl font-semibold text-gray-800">
        {children}
      </Tag>
    </motion.div>
  );
}
