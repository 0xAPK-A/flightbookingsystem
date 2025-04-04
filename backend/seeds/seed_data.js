exports.seed = async function(knex) {
  // Clear existing data (important for clean seed)
  await knex('payments').del();
  await knex('bookings').del();
  await knex('itinerary_segments').del();
  await knex('itineraries').del();
  await knex('flight_segments').del();
  await knex('aircraft').del();
  await knex('users').del();

  // Insert Users
  await knex('users').insert([
    {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'password123', // plain password
      is_verified: true
    },
    {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: 'qwerty', // another plain password
      is_verified: false
    }
  ]);

  // Insert Aircraft
  await knex('aircraft').insert([
    {
      tail_number: 'IND123',
      model: 'Boeing 737',
      seating_capacity: 180,
      status: 'active'
    },
    {
      tail_number: 'IND456',
      model: 'Airbus A320',
      seating_capacity: 160,
      status: 'maintenance'
    }
  ]);

  // Insert Flight Segments
  await knex('flight_segments').insert([
    {
      flight_number: 'AI101',
      airline: 'Air India',
      departure_airport: 'DEL',
      arrival_airport: 'BOM',
      departure_time: '2025-04-05 10:00:00',
      arrival_time: '2025-04-05 12:30:00',
      price: 5000.00,
      available_seats: 100,
      aircraft_id: 1
    },
    {
      flight_number: '6E202',
      airline: 'IndiGo',
      departure_airport: 'BOM',
      arrival_airport: 'BLR',
      departure_time: '2025-04-05 14:00:00',
      arrival_time: '2025-04-05 16:15:00',
      price: 4500.00,
      available_seats: 90,
      aircraft_id: 2
    }
  ]);
};
