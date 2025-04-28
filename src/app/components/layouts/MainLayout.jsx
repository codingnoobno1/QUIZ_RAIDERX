'use client';

import Sidebar from '../Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
