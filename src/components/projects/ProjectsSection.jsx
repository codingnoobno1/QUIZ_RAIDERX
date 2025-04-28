'use client';

import { motion } from 'framer-motion';
import { FileText, Edit, Eye } from 'lucide-react';

export default function ProjectsSection() {
  const projects = [
    { id: 1, name: 'Project Alpha', description: 'A web application for task management' },
    { id: 2, name: 'Project Beta', description: 'A mobile app for note-taking and organization' },
    { id: 3, name: 'Project Gamma', description: 'A machine learning model for prediction' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
    >
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xl font-semibold text-gray-800">{project.name}</h3>
          <p className="text-gray-600 mt-2">{project.description}</p>
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
