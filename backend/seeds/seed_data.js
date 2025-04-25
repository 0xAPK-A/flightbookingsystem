// seeds/seed_data.js
const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  const saltRounds = 10;

  // Clear existing data in reverse dependency order
  await knex('payments').del();
  await knex('passengers').del();
  await knex('bookings').del();
  await knex('itinerary_segments').del();
  await knex('itineraries').del();
  await knex('flight_schedules').del();
  await knex('flight_segments').del();
  await knex('aircraft').del();
  await knex('users').del();

  // Insert Users
  const hashedAlice = await bcrypt.hash('alice123', saltRounds);
  const hashedBob = await bcrypt.hash('bobpass', saltRounds);
  const hashedCharlie = await bcrypt.hash('charlie456', saltRounds);
  const hashedDiana = await bcrypt.hash('diana789', saltRounds);
  
  await knex('users').insert([
    {
      name: 'Alice Singh',
      email: 'alice@flight.com',
      password: hashedAlice,
      is_verified: true
    },
    {
      name: 'Bob Patel',
      email: 'bob@flight.com',
      password: hashedBob,
      is_verified: true
    },
    {
      name: 'Charlie Kumar',
      email: 'charlie@flight.com',
      password: hashedCharlie,
      is_verified: true
    },
    {
      name: 'Diana Sharma',
      email: 'diana@flight.com',
      password: hashedDiana,
      is_verified: false
    }
  ]);

  // Insert Aircraft
  await knex('aircraft').insert([
    {
      tail_number: 'VT-IND1',
      model: 'Boeing 737-800',
      seating_capacity: 180,
      status: 'active'
    },
    {
      tail_number: 'VT-IND2',
      model: 'Airbus A320neo',
      seating_capacity: 160,
      status: 'active'
    },
    {
      tail_number: 'VT-AIR3',
      model: 'Boeing 777-300ER',
      seating_capacity: 340,
      status: 'active'
    },
    {
      tail_number: 'VT-IGO4',
      model: 'Airbus A321',
      seating_capacity: 200,
      status: 'active'
    },
    {
      tail_number: 'VT-SJT5',
      model: 'Bombardier Q400',
      seating_capacity: 78,
      status: 'maintenance'
    },
    {
      tail_number: 'VT-AXM6',
      model: 'ATR 72-600',
      seating_capacity: 68,
      status: 'active'
    }
  ]);

  // Insert Flight Segments (static info)
  await knex('flight_segments').insert([
    // Air India routes
    {
      flight_number: 'AI101',
      airline: 'Air India',
      departure_airport: 'DEL',
      arrival_airport: 'BOM',
      departure_time: '08:00:00',
      arrival_time: '10:30:00',
      price: 5500.00,
      aircraft_id: 1
    },
    {
      flight_number: 'AI205',
      airline: 'Air India',
      departure_airport: 'BOM',
      arrival_airport: 'DEL',
      departure_time: '18:30:00',
      arrival_time: '21:00:00',
      price: 5700.00,
      aircraft_id: 1
    },
    {
      flight_number: 'AI312',
      airline: 'Air India',
      departure_airport: 'DEL',
      arrival_airport: 'CCU',
      departure_time: '07:15:00',
      arrival_time: '09:45:00',
      price: 6200.00,
      aircraft_id: 3
    },
    
    // IndiGo routes
    {
      flight_number: '6E202',
      airline: 'IndiGo',
      departure_airport: 'BOM',
      arrival_airport: 'BLR',
      departure_time: '12:00:00',
      arrival_time: '14:15:00',
      price: 4800.00,
      aircraft_id: 2
    },
    {
      flight_number: '6E121',
      airline: 'IndiGo',
      departure_airport: 'BLR',
      arrival_airport: 'HYD',
      departure_time: '09:30:00',
      arrival_time: '10:45:00',
      price: 3200.00,
      aircraft_id: 2
    },
    {
      flight_number: '6E425',
      airline: 'IndiGo',
      departure_airport: 'MAA',
      arrival_airport: 'DEL',
      departure_time: '13:45:00',
      arrival_time: '16:30:00',
      price: 6100.00,
      aircraft_id: 4
    },
    
    // SpiceJet routes
    {
      flight_number: 'SG305',
      airline: 'SpiceJet',
      departure_airport: 'DEL',
      arrival_airport: 'HYD',
      departure_time: '16:45:00',
      arrival_time: '19:00:00',
      price: 5000.00,
      aircraft_id: 1
    },
    {
      flight_number: 'SG418',
      airline: 'SpiceJet',
      departure_airport: 'CCU',
      arrival_airport: 'MAA',
      departure_time: '10:15:00',
      arrival_time: '12:45:00',
      price: 4200.00,
      aircraft_id: 5
    },
    
    // Vistara routes
    {
      flight_number: 'UK876',
      airline: 'Vistara',
      departure_airport: 'DEL',
      arrival_airport: 'BLR',
      departure_time: '06:00:00',
      arrival_time: '08:45:00',
      price: 7200.00,
      aircraft_id: 3
    },
    {
      flight_number: 'UK543',
      airline: 'Vistara',
      departure_airport: 'BOM',
      arrival_airport: 'JAI',
      departure_time: '14:30:00',
      arrival_time: '16:15:00',
      price: 4900.00,
      aircraft_id: 2
    },
    
    // Alliance Air routes
    {
      flight_number: 'CD777',
      airline: 'Alliance Air',
      departure_airport: 'JAI',
      arrival_airport: 'DEL',
      departure_time: '17:30:00',
      arrival_time: '19:00:00',
      price: 3800.00,
      aircraft_id: 6
    },
    {
      flight_number: 'CD612',
      airline: 'Alliance Air',
      departure_airport: 'HYD',
      arrival_airport: 'CCU',
      departure_time: '06:45:00',
      arrival_time: '09:15:00',
      price: 5600.00,
      aircraft_id: 6
    }
  ]);

  // Generate dates for the next 30 days
  const generateFutureDates = (days) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  const futureDates = generateFutureDates(30);
  
  // Insert Flight Schedules (date-specific info)
  const flightSchedules = [];
  
  // Add schedules for all flight segments across multiple dates
  const segments = await knex('flight_segments').select('id');
  
  for (const segment of segments) {
    // Add schedules for different dates with varying available seats
    for (const date of futureDates) {
      // Random available seats between 50% and 100% of capacity
      const aircraft = await knex('aircraft')
        .join('flight_segments', 'aircraft.id', 'flight_segments.aircraft_id')
        .where('flight_segments.id', segment.id)
        .select('aircraft.seating_capacity')
        .first();
      
      const capacity = aircraft ? aircraft.seating_capacity : 180;
      const minSeats = Math.floor(capacity * 0.5);
      const maxSeats = capacity;
      const availableSeats = Math.floor(Math.random() * (maxSeats - minSeats + 1)) + minSeats;
      
      flightSchedules.push({
        segment_id: segment.id,
        flight_date: date,
        available_seats: availableSeats
      });
    }
  }
  
  await knex('flight_schedules').insert(flightSchedules);
  
  console.log(`Seeded ${segments.length} flight segments with ${futureDates.length} dates each (total: ${flightSchedules.length} schedules)`);
};