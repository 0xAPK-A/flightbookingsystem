'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    console.log('Extracted token:', t)
    setToken(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token || !password) {
      setError('Missing token or password')
      return
    }


    try {
      const res = await fetch('http://localhost:5001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(data.message)
        setError('')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setError(data.error || 'Reset failed.')
        setMessage('')
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong.')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2>Reset Password</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="password"
          placeholder="New password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none' }}>
          Reset Password
        </button>
      </form>
    </div>
  )
}
