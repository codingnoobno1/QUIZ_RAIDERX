'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import useUserStore from '@/store/useUserStore';

export default function Page() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const { user, loginTime, logout } = useUserStore();
  const router = useRouter();

  const toggleSidebar = () => setIsExpanded(prev => !prev);

  // Countdown timer
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          logout();
          alert('Session expired. You will be logged out.');
          router.push('/login'); // or your login path
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000000' }}>
      <Sidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      <main
        style={{
          flexGrow: 1,
          padding: '2rem',
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
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#00FFCC',
          textShadow: '0 0 10px #00FFCC, 0 0 20px #00FFCC',
        }}>
          Welcome, {user?.username || 'Guest'}!
        </h1>

        <h2 style={{
          fontSize: '2rem',
          marginTop: '1rem',
          color: '#66CCFF',
        }}>
          You’ve entered the PIXEL Club’s QUIZ RAIDER X dashboard.
        </h2>

        {user && (
          <>
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              border: '1px solid #444',
              borderRadius: '12px',
              backgroundColor: '#111111',
              width: '80%',
              maxWidth: '600px',
              boxShadow: '0 0 15px rgba(0,255,200,0.3)',
            }}>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Login Time:</strong> {loginTime}</p>
            </div>

            <p style={{
              marginTop: '1.5rem',
              fontSize: '1.25rem',
              color: '#FF6666',
            }}>
              Session expires in: <strong>{formatTime(timeLeft)}</strong>
            </p>
          </>
        )}

        {!user && (
          <p style={{ marginTop: '2rem', color: '#ccc' }}>
            You are not logged in. Please go to the login page.
          </p>
        )}
      </main>
    </div>
  );
}
