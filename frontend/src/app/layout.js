'use client';

import './styles/global.css';
import Navbar from './components/Navbar';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ padding: '1rem' }}>{children}</main>
        <footer style={{ textAlign: 'center', padding: '1rem', borderTop: '1px solid #ddd', marginTop: '2rem', backgroundColor: '#f0f0f0' }}>
          <p>© 2025 Flight Management System</p>
        </footer>
      </body>
    </html>
  );
}
