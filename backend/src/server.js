require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const flightsRoutes = require("./routes/flights.routes"); // Import the flights routes
const bookingsRoutes = require('./routes/bookings.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // your Next.js frontend
    credentials: true,
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/flights", flightsRoutes); // Add the flights routes here
app.use('/api/bookings', bookingsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
