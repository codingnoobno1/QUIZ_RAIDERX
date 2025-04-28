'use client';

import Sidebar from '../Sidebar';
import MainContent from '../MainContent';

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <MainContent>{children}</MainContent>
      </main>
    </div>
  );
}
