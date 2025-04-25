'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${suffix}`;
}


export default function BookingHistory() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItinerary, setExpandedItinerary] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      router.push('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/bookings/history', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Response status:', res.status);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch booking history');
        }

        const data = await res.json();
        console.log('History data:', data);
        setHistory(data.history || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to fetch booking history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/bookings/cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to cancel booking');
      }

      // On success, re-fetch the booking history
      const updatedHistoryRes = await fetch('http://localhost:5001/api/bookings/history', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const updatedHistoryData = await updatedHistoryRes.json();
      setHistory(updatedHistoryData.history);
      alert('Booking cancelled successfully');

    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDetails = (itineraryId) => {
    setExpandedItinerary(expandedItinerary === itineraryId ? null : itineraryId);
  };

  const isFutureDate = (date) => {
    if (!date) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for date comparison
  
  const flightDate = new Date(date);
  return flightDate > today;
  };
  const canCancelBooking = (itinerary) => {
    // Check if booking is already cancelled
    if (itinerary.booking_status === 'cancelled') return false;
    
    // Check if the flight date is in the future
    return itinerary.flights.some(flight => isFutureDate(flight.flight_date));
  };


  if (loading) return <p className="p-4">Loading booking history...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;
  if (history.length === 0) return <p className="p-4">No bookings found.</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Your Booking History</h2>
      {history.map((itinerary) => (
        <div 
          key={itinerary.itinerary_id} 
          className={`border p-4 rounded-xl shadow mb-6 ${
            itinerary.booking_status === 'cancelled' ? 'bg-gray-50' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h3 className="text-lg font-bold mr-2">
                Itinerary #{itinerary.itinerary_id}
              </h3>
              
              {/* Status badge - made more prominent */}
              <span 
                className={`px-2 py-1 rounded text-sm font-medium ${
                  itinerary.booking_status === 'cancelled' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}
                style={{
                  backgroundColor: itinerary.booking_status === 'cancelled' ? '#fee2e2' : '#d1fae5',
                  color: itinerary.booking_status === 'cancelled' ? '#b91c1c' : '#047857'
                }}
              >
                {itinerary.booking_status === 'cancelled' ? 'Cancelled' : 'Confirmed'}
              </span>
            </div>
            
            {/* Add PNR display here */}
            <div className="text-sm text-gray-600">
              {itinerary.pnr && <span>PNR: <span className="font-medium">{itinerary.pnr}</span></span>}
            </div>
          </div>
          
          {/* Price and booking date */}
          <div className="mt-2 text-sm">
            <p>Total Price: <span className="font-medium">₹{itinerary.total_price}</span></p>
            <p>Booked On: <span className="font-medium">{new Date(itinerary.booked_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span></p>
          </div>
  
          {/* View Details Button */}
          <button
            onClick={() => handleViewDetails(itinerary.itinerary_id)}
            className={`${
              itinerary.booking_status === 'cancelled' 
                ? 'bg-gray-500'
                : 'bg-blue-500'
            } text-white px-4 py-2 rounded-md mt-3 hover:opacity-90 transition-opacity`}
          >
            {expandedItinerary === itinerary.itinerary_id ? 'Hide Details' : 'View Details'}
          </button>
  
          {/* Conditionally render flight details if expanded */}
          {expandedItinerary === itinerary.itinerary_id && (
            <div className="mt-3">
              <h4 className="font-semibold">Flight:</h4>
              {itinerary.flights.map((flight, idx) => (
                <div key={idx} className="mb-4 p-3 border rounded-lg shadow-sm bg-white">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <p className="font-bold text-lg mb-1">
                      <strong>{flight.airline}</strong> <span className="text-blue-600">{flight.flight_number}</span>
                      </p>
                      <p className="text-gray-700 mb-2">
                        {flight.departure_airport} ➡️ {flight.arrival_airport}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 md:text-right">
                      <p className="mb-1">
                        <span className="text-gray-600">Departure:</span> <span className="font-medium">{formatTime(flight.departure_time)}</span>
                      </p>
                      <p className="mb-1">
                        <span className="text-gray-600">Arrival:</span> <span className="font-medium">{formatTime(flight.arrival_time)}</span>
                      </p>
                      <p className="text-gray-600 text-sm">  <span className="text-gray-600">Date:</span>
                        {flight.flight_date ? new Date(flight.flight_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'Date not available'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <h4 className="font-semibold mt-4">Passengers:</h4>
              <ul>
                {itinerary.passengers.map((passenger, idx) => (
                  <li key={idx} className="mb-1 flex justify-between items-center border-b pb-2 last:border-0">
                    <span>
                      {passenger.name} (Age: {passenger.age}, Gender: {passenger.gender})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
  
          {/* Cancel button */}
          {canCancelBooking(itinerary) && (
            <div className="mt-4">
              <button
                onClick={() => handleCancelBooking(itinerary.booking_id)}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}