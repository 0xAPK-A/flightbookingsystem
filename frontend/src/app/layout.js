'use client';

export default function RootLayout({ children }) {
  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // Clear the stored token
    window.location.href = '/login'; // Redirect to login page
  };

  return (
    <html lang="en">
      <body>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f0f0f0',
            borderBottom: '1px solid #ddd'
          }}
        >
          <h1>Flight Management System</h1>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ff4d4d',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </header>

        <main style={{ padding: '1rem' }}>{children}</main>

        <footer
          style={{
            textAlign: 'center',
            padding: '1rem',
            borderTop: '1px solid #ddd',
            marginTop: '2rem',
            backgroundColor: '#f0f0f0'
          }}
        >
          <p>© 2025 Flight Management System</p>
        </footer>
      </body>
    </html>
  );
}
