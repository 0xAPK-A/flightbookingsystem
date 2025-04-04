'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('accessToken', data.token)
        alert('Login successful!')
        router.push('/bookings')
      } else {
        setError(data.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong. Please try again later.')
    }
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '4rem auto',
      padding: '2rem',
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Login</h2>
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
        <p>Don't have an account? <a href="/signup">Signup here</a></p>
      </form>
    </div>
  )
 

}
