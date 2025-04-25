'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AIRPORTS = [
  { code: 'DEL', name: 'Delhi' },
  { code: 'BOM', name: 'Mumbai' },
  { code: 'BLR', name: 'Bangalore' },
  { code: 'HYD', name: 'Hyderabad' },
  { code: 'CCU', name: 'Kolkata' },
  { code: 'MAA', name: 'Chennai' },
  { code: 'JAI', name: 'Jaipur' },
];

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${suffix}`;
}
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function Bookings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  


  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:5001/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
          setUser(data);
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (err) {
        console.error('Auth fetch failed', err);
      }
    };

    fetchUser();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!source || !destination || !date) {
      setError('Please fill all fields');
      return;
    }
    if (source === destination) {
      setError('Source and destination cannot be the same');
      return;
    }

    // Ensure the date is in YYYY-MM-DD format
    console.log('Selected date:', date);

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5001/api/flights/search?source=${source}&destination=${destination}&date=${date}`);
      const data = await res.json();

      if (res.ok) {
        if (data.length === 0) {
          setError('No flights available');
          setFlights([]); // Clear any previous flights
        } else {
          setFlights(data);
          setError(''); // Clear any previous error
        }
      } else {
        setError(data.error || 'Error fetching flights');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch flights');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = (flight) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please login to book a flight.');
      router.push('/login');
      return;
    }

    const selectedDate = date;
    router.push(`/bookings/confirm?flight_number=${flight.flight_number}&date=${selectedDate}&user_id=${user.id}`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h1>Welcome, {user?.name || 'Anonymous'}!</h1>
      {user?.email && <p>Email: {user.email}</p>}

      <hr style={{ margin: '1rem 0' }} />

      <h2>Search Flights</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select value={source} onChange={(e) => setSource(e.target.value)} style={{ flex: 1, padding: '10px' }}>
          <option value="">Select Source</option>
          {AIRPORTS.map(a => (
            <option key={a.code} value={a.code}>{a.name} ({a.code})</option>
          ))}
        </select>

        <select value={destination} onChange={(e) => setDestination(e.target.value)} style={{ flex: 1, padding: '10px' }}>
          <option value="">Select Destination</option>
          {AIRPORTS.map(a => (
            <option key={a.code} value={a.code}>{a.name} ({a.code})</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={getTodayDate()} 
          style={{ padding: '10px' }}
        />

        <button type="submit" style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {flights.length > 0 && (
        <div>
          <h3>Available Flights</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {flights.map((flight) => (
              <li key={flight.flight_number} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
                <p><strong>{flight.flight_number}</strong> - {flight.airline} ({flight.departure_airport} ➡️ {flight.arrival_airport})</p>
                <p>Departure: {formatTime(flight.departure_time)}</p>
                <p>Arrival: {formatTime(flight.arrival_time)}</p>
                <p>Fare: ₹{flight.price}</p>
                <p>Available Seats: {flight.available_seats}</p>
                <button
                  onClick={() => handleBooking(flight)}
                  style={{ marginTop: '0.5rem', padding: '8px', backgroundColor: '#28a745', color: 'white' }}
                >
                  Book Now
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
