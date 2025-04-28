'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditorSection({ code, setCode, language, setLanguage }) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4">
        <label className="block text-lg font-medium text-gray-700">Select Language:</label>
        <select
          className="p-2 border rounded w-full bg-white"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
      </div>

      <motion.div
        className="border rounded-lg overflow-hidden h-96 bg-gray-800"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value || "")}
          options={{ fontSize: 14, minimap: { enabled: false } }}
        />
      </motion.div>
    </motion.div>
  );
}
