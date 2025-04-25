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

// Search for flights by source, destination, and date
exports.searchFlights = async (req, res) => {
    try {
        const { source, destination, date } = req.query;

        // Validate input parameters
        if (!source || !destination || !date) {
            return res.status(400).json({ error: 'Source, destination, and date are required' });
        }

        // Validate and format the date
        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }
        const formattedDate = selectedDate.toISOString().split('T')[0];

        //console.log('Query Params:', { source, destination, formattedDate });

        // SQL query to join flight_segments and flight_schedules, filter by date, source, destination
        const query = `
            SELECT 
                fs.flight_number, fs.airline, fs.departure_airport, fs.arrival_airport, 
                fs.departure_time, fs.arrival_time, fs.price, 
                fsd.available_seats, fsd.flight_date
            FROM flight_segments fs
            JOIN flight_schedules fsd ON fs.id = fsd.segment_id
            WHERE 
                fs.departure_airport = $1 AND
                fs.arrival_airport = $2 AND
                fsd.flight_date = $3;
        `;

        const values = [source, destination, formattedDate];
        const result = await pool.query(query, values);

        // Handle empty results
        if (result.rows.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error searching for flights:', error);
        res.status(500).json({ error: 'Failed to search flights' });
    }
};

