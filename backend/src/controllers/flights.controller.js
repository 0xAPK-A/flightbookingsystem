const pool = require('../db');

// Get all flight segments
exports.getAllFlights = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM flight_segments');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching flights:', error);
        res.status(500).json({ error: 'Failed to fetch flights' });
    }
};

// Create a new flight segment
exports.createFlight = async (req, res) => {
    try {
        const { flight_number, airline, departure_airport, arrival_airport, departure_time, arrival_time, price, available_seats, aircraft_id } = req.body;
        const query = `
            INSERT INTO flight_segments (flight_number, airline, departure_airport, arrival_airport, departure_time, arrival_time, price, available_seats, aircraft_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [flight_number, airline, departure_airport, arrival_airport, departure_time, arrival_time, price, available_seats, aircraft_id];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating flight:', error);
        res.status(500).json({ error: 'Failed to create flight' });
    }
};
