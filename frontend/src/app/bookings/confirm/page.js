'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ConfirmBooking() {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const flightNumber = searchParams.get('flight_number');
  const date = searchParams.get('date');
  const userId = searchParams.get('user_id'); // Extract the user ID

  const [passengers, setPassengers] = useState([{ name: '', age: '', gender: '' }]);
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Add a new passenger
  const addPassenger = () => {
    setPassengers([...passengers, { name: '', age: '', gender: '' }]);
  };

  // Remove a passenger
  const removePassenger = (index) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  // Update passenger details
  const updatePassenger = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index][field] = value;
    setPassengers(updatedPassengers);
  };

  // Handle booking submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!email || !contactNumber || passengers.some(p => !p.name || !p.age || !p.gender)) {
      setError('Please fill all fields');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('You must be logged in to book a flight');
      setTimeout(() => {
        router.push('/login?redirect=/bookings/confirm');
      }, 1500);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flight_number: flightNumber,
          date,
          email,
          contact_number: contactNumber,
          passengers,
          user_id: userId
        }),
      });

      // Check response content type
      const contentType = res.headers.get('content-type');
    
      // Handle non-JSON responses
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        setError(`Server error: ${res.status} ${res.statusText}`);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        alert(`Booking confirmed! Your PNR is: ${data.pnr || 'N/A'}`);
        router.push('/bookings'); // Redirect to bookings page
      } else {
        setError(data.error || 'Failed to confirm booking');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to confirm booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h1>Confirm Your Booking</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleBookingSubmit}>
        <h2>Passenger Details</h2>
        {passengers.map((passenger, index) => (
          <div key={index} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
            <h3>Passenger {index + 1}</h3>
            <label>Name:</label>
            <input
              type="text"
              value={passenger.name}
              onChange={(e) => updatePassenger(index, 'name', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
            />
            <label>Age:</label>
            <input
              type="number"
              value={passenger.age}
              onChange={(e) => updatePassenger(index, 'age', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
            />
            <label>Gender:</label>
            <select
              value={passenger.gender}
              onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {passengers.length > 1 && (
              <button type="button" onClick={() => removePassenger(index)} style={{ color: 'red' }}>
                Remove Passenger
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addPassenger} style={{ marginBottom: '1rem' }}>
          Add Passenger
        </button>

        <h2>Contact Details</h2>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
        />
        <label>Contact Number:</label>
        <input
          type="text"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
        />

        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Submitting...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}