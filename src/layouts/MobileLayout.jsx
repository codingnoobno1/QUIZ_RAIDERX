'use client';

import { useState } from 'react';
import CircularNav from '@components/CircularNav';

export default function MobileLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 flex items-center px-4 z-20">
          <button
            onClick={() => setNavOpen(prev => !prev)}
            className="text-cyan-400 focus:outline-none"
            aria-label="Toggle navigation"
          >
            {/* burger icon */}
            <svg width="24" height="24" fill="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2"/>
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-bold text-cyan-400">PIXEL Club</h1>
        </header>

        {/* CircularNav overlay */}
        {navOpen && <CircularNav onClose={() => setNavOpen(false)} />}

        {/* Main Content */}
        <main className="pt-16 px-4 pb-4 overflow-auto flex-1">
          {children}
        </main>
      </div>
    
  );
}
