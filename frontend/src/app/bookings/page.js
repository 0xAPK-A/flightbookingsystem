'use client'
import { useEffect, useState } from 'react'

export default function Bookings() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Please login first')
        return
      }

      const res = await fetch('http://localhost:5001/api/auth/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (res.ok) {
        setUser(data)
      } else {
        alert('Invalid or expired token. Please login again.')
        localStorage.removeItem('accessToken')
      }
    }

    fetchUser()
  }, [])

  if (!user) return <p>Loading...</p>

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}
