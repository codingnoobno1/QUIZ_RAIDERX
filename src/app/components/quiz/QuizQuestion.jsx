'use client';

import { motion } from 'framer-motion';

export default function QuizQuestion({ question, options, selected, onSelect }) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-lg mb-4">{question}</p>
      <div className="space-y-2">
        {options.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => onSelect(option)}
            className={`p-2 w-full text-left border rounded-md transition-all duration-200 ease-in-out ${
              selected === option
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-blue-500 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
