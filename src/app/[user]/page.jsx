'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function Page() {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const toggleSidebar = () => setIsExpanded(prev => !prev);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000000' }}> {/* Black background */}
      <Sidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
      <main
        style={{
          flexGrow: 1,
          padding: '1rem',
          overflowY: 'auto',
          transition: 'margin-left 0.3s ease',
          marginLeft: isExpanded ? '250px' : '0',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        {/* Title with metallic glowing effect */}
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#ff4d4d', // Red color for the first line
          textShadow: '0 0 20px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,1)',
          animation: 'slowGlow 5s ease-in-out infinite, shine 2s ease-in-out infinite',
        }}>
          PIXEL Club AUP
        </h1>
        <h2 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#3399ff', // Blue color for the second line
          marginTop: '1rem',
          textShadow: '0 0 20px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,1)',
          animation: 'slowGlow 5s ease-in-out infinite, shine 2s ease-in-out infinite',
        }}>
          QUIZ RAIDER X
        </h2>
        <p style={{ textAlign: 'center', fontSize: '1.2rem', marginTop: '2rem' }}>
          This is your main content.
        </p>
      </main>
      
      <style jsx>{`
        @keyframes slowGlow {
          0% {
            text-shadow: 0 0 20px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,1);
          }
          50% {
            text-shadow: 0 0 30px rgba(255,255,255,1), 0 0 40px rgba(255,255,255,1), 0 0 50px rgba(255,255,255,1);
          }
          100% {
            text-shadow: 0 0 20px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,1);
          }
        }

        @keyframes shine {
          0% {
            background-position: -200%;
          }
          100% {
            background-position: 200%;
          }
        }

        h1, h2 {
          background: linear-gradient(45deg, #ff4d4d, #3399ff); // Gradient with red and blue
          background-size: 400% 400%;
          color: transparent;
          -webkit-background-clip: text;
          animation: shine 3s ease-in-out infinite, slowGlow 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
