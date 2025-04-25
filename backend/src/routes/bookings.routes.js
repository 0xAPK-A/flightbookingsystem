const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller');
const authenticate = require('../middlewares/auth.middleware');

router.post('/', authenticate, bookingsController.createBooking);
router.get('/history', authenticate, bookingsController.getBookingHistory);
router.get('/pnr/:pnr', bookingsController.getBookingByPNR);
router.post('/cancel/:id', authenticate, bookingsController.cancelBooking);

module.exports = router;
