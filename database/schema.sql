CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT
);

-- Aircraft Table (manages aircraft data)
CREATE TABLE aircraft (
    id SERIAL PRIMARY KEY,
    tail_number VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(50),
    seating_capacity INT,
    status VARCHAR(20) CHECK (status IN ('active', 'maintenance', 'decommissioned')) DEFAULT 'active'
);

-- Flight Segments Table (each leg of a journey)
CREATE TABLE flight_segments (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL,
    airline VARCHAR(100) NOT NULL,
    departure_airport VARCHAR(50) NOT NULL,
    arrival_airport VARCHAR(50) NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INT NOT NULL,
    aircraft_id INT REFERENCES aircraft(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Itineraries Table (for multi-leg journeys)
CREATE TABLE itineraries (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    total_price DECIMAL(10,2) NOT NULL,
    total_duration INTERVAL,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Itinerary Segments Mapping
CREATE TABLE itinerary_segments (
    id SERIAL PRIMARY KEY,
    itinerary_id INT REFERENCES itineraries(id) ON DELETE CASCADE,
    segment_id INT REFERENCES flight_segments(id) ON DELETE CASCADE,
    sequence_no INT,  -- order of segments
    layover_duration INTERVAL
);

-- Bookings Table (tying itineraries to booking records)
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    itinerary_id INT REFERENCES itineraries(id) ON DELETE CASCADE,
    booking_status VARCHAR(20) CHECK (booking_status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table (optional, for handling payments)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
    paid_at TIMESTAMP
);
