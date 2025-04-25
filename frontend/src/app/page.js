'use client';

import { useEffect, useState } from 'react';

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${suffix}`;
}


export default function Home() {
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/flights')
      .then((res) => res.json())
      .then((data) => setFlights(data))
      .catch((err) => console.error('Error fetching flights:', err));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Welcome to the Flight Management System
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '2rem' }}>
        Manage your flights efficiently with our platform.
      </p>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Available Flights</h2>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {flights.map((flight) => (
          <div
            key={flight.id}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {flight.flight_number} - {flight.airline} ({flight.departure_airport} to {flight.arrival_airport})
            </h3>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Departure:</strong> {formatTime(flight.departure_time)}<br />
              <strong>Arrival:</strong> {formatTime(flight.arrival_time)}<br />
              <strong>Price:</strong> ₹{flight.price.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
