'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Next.js navigation
import './login.css'; // Assuming login.css is in the same directory

import RegisterPage from './Register';
import LoginPage from './Login';

function HomePage() {
  const [showLogin, setShowLogin] = useState(true); // Initially show LoginPage
  const router = useRouter(); // Use of Next.js router for navigation

  const toggleForm = () => {
    setShowLogin(!showLogin); // Toggle between Login and Register forms
  };

  return (
    <div className="container">
      <h1>Welcome to Pixel Quiz Raiderx</h1>

      {/* Toggle Buttons */}
      <div>
        <button onClick={toggleForm}>
          {showLogin ? 'Go to Register' : 'Go to Login'}
        </button>
      </div>

      {/* Render RegisterPage or LoginPage based on state */}
      {showLogin ? (
        <div>
          <LoginPage />
        </div>
      ) : (
        <div>
          <RegisterPage />
        </div>
      )}
    </div>
  );
}

export default HomePage;
