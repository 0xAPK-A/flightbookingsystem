const express = require('express');
const router = express.Router();
const flightsController = require('../controllers/flights.controller');

// GET /api/flights - list all flight segments
router.get('/', flightsController.getAllFlights);

// POST /api/flights - create a new flight segment (admin/operator only)
router.post('/', flightsController.createFlight);
router.get('/search', flightsController.searchFlights);

module.exports = router;
