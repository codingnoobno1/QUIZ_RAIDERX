'use client';

import { motion } from 'framer-motion';
import { UserCircle } from 'lucide-react';

export default function ProfileSection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center space-y-4 p-6"
    >
      <UserCircle size={120} className="text-blue-600" />
      <h2 className="text-2xl font-semibold text-gray-800">John Doe</h2>
      <p className="text-lg text-gray-600">Software Developer | Tech Enthusiast</p>
      <p className="text-center text-gray-500 max-w-lg">
        Passionate about building innovative software solutions and contributing to open-source projects.
      </p>
      <div className="mt-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
          Edit Profile
        </button>
      </div>
    </motion.div>
  );
}
