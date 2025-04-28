'use client';

import { motion } from 'framer-motion';
import { FileCode, Edit, Eye } from 'lucide-react';

export default function SolutionsSection() {
  const solutions = [
    { id: 1, title: 'Solution Alpha', description: 'Algorithmic problem solving for optimization.' },
    { id: 2, title: 'Solution Beta', description: 'Code snippet for sorting algorithms in JavaScript.' },
    { id: 3, title: 'Solution Gamma', description: 'Deep learning model for image recognition.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
    >
      {solutions.map((solution) => (
        <div
          key={solution.id}
          className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xl font-semibold text-gray-800">{solution.title}</h3>
          <p className="text-gray-600 mt-2">{solution.description}</p>
          <div className="mt-4 flex gap-4">
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <Eye size={16} /> View
            </button>
            <button className="flex items-center gap-2 text-green-600 hover:text-green-800">
              <Edit size={16} /> Edit
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
