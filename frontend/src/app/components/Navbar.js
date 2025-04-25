'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, [pathname]); // triggers update when route changes

  const handleAuthClick = () => {
    if (isLoggedIn) {
      localStorage.removeItem('accessToken');
      setIsLoggedIn(false);
      router.push('/login');
    } else {
      router.push('/login');
    }
  };

  const handleProtectedClick = (path) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    } else {
      router.push(path);
    }
  };

  const navButtonStyle = {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '8px 12px',
    cursor: 'pointer'
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: '#f0f0f0',
      borderBottom: '1px solid #ddd'
    }}>
      <h1>Flight Management System</h1>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <button style={navButtonStyle} onClick={() => router.push('/')}>Home</button>
        <button style={navButtonStyle} onClick={() => router.push('/bookings')}>Flights</button>
        <button style={navButtonStyle} onClick={() => router.push('/pnr')}>PNR Status</button>
        <button style={navButtonStyle} onClick={() => handleProtectedClick('/history')}>Booking History</button>
        <button
          style={{
            ...navButtonStyle,
            backgroundColor: isLoggedIn ? '#ff4d4d' : '#007bff'
          }}
          onClick={handleAuthClick}
        >
          {isLoggedIn ? 'Logout' : 'Login'}
        </button>
      </nav>
    </header>
  );
}
