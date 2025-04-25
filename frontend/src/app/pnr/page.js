'use client';

import { useState } from 'react';

export default function PnrLookup() {
  const [pnr, setPnr] = useState('');
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pnr) {
      setError('Please enter a PNR number');
      return;
    }

    setLoading(true);
    setError('');
    setTicketDetails(null);

    try {
      const res = await fetch(`http://localhost:5001/api/bookings/pnr/${pnr}`);
      const data = await res.json();

      if (res.ok) {
        setTicketDetails(data);
      } else {
        setError(data.error || 'No booking found for this PNR');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h1>PNR Status</h1>
      <p>Enter your PNR number to check your booking status</p>

      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={pnr}
            onChange={(e) => setPnr(e.target.value.toUpperCase())}
            placeholder="Enter PNR (e.g., ABC12345)"
            style={{ 
              flex: '1', 
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '0.25rem'
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#0070f3', 
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {ticketDetails && (
        <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <h2>Booking Found</h2>
          <div style={{ marginBottom: '1rem' }}>
            <h3>Ticket Details</h3>
            <p><strong>PNR:</strong> {ticketDetails.pnr}</p>
            <p><strong>Status:</strong> {ticketDetails.booking_status}</p>
            <p><strong>Date:</strong> {ticketDetails.date}</p>
            <p><strong>Contact:</strong> {ticketDetails.email}</p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3>Flight Details</h3>
            <p><strong>Flight Number:</strong> {ticketDetails.flight_number}</p>
            <p><strong>Airline:</strong> {ticketDetails.airline}</p>
            <p><strong>From:</strong> {ticketDetails.departure_airport}</p>
            <p><strong>To:</strong> {ticketDetails.arrival_airport}</p>
            <p><strong>Departure:</strong> {ticketDetails.departure_time}</p>
            <p><strong>Arrival:</strong> {ticketDetails.arrival_time}</p>
          </div>

          <div>
            <h3>Passengers</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {ticketDetails.passengers.map((passenger, index) => (
                <li key={index} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5' }}>
                  <p><strong>Name:</strong> {passenger.name}</p>
                  <p><strong>Age:</strong> {passenger.age}</p>
                  <p><strong>Gender:</strong> {passenger.gender}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}