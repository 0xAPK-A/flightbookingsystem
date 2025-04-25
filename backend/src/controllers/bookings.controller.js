const { v4: uuidv4 } = require('uuid'); // For generating unique PNR
const nodemailer = require('nodemailer');
const knex = require('../../knex');

exports.getBookingHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const itineraries = await knex('itineraries')
      .where({ user_id: userId })
      .orderBy('booked_at', 'desc');

    const results = [];

    for (const itinerary of itineraries) {
      // Get flight segments
      const segments = await knex('itinerary_segments')
        .where({ itinerary_id: itinerary.id })
        .join('flight_segments', 'flight_segments.id', 'itinerary_segments.segment_id')
        .leftJoin('flight_schedules', function () {
          this.on('flight_schedules.segment_id', '=', 'itinerary_segments.segment_id')
              .andOn('flight_schedules.flight_date', '=', 'itinerary_segments.flight_date');
        })
        .select(
          'flight_segments.flight_number',
          'flight_segments.airline',
          'flight_segments.departure_airport',
          'flight_segments.arrival_airport',
          'flight_segments.departure_time',
          'flight_segments.arrival_time',
          'flight_segments.price',
          'itinerary_segments.flight_date',
          'flight_schedules.available_seats',
          'itinerary_segments.sequence_no'
        )
        .orderBy('itinerary_segments.sequence_no');

      // Get bookings for this itinerary
      const bookings = await knex('bookings')
        .where({ itinerary_id: itinerary.id });

      // Get passengers for each booking
      const passengers = [];
      for (const booking of bookings) {
        const bookingPassengers = await knex('passengers')
          .where({ booking_id: booking.id })
          .select('name', 'age', 'gender');
          
        passengers.push(...bookingPassengers);
      }

      results.push({
        itinerary_id: itinerary.id,
        booking_id: bookings.length > 0 ? bookings[0].id : null,
        total_price: itinerary.total_price,
        total_duration: itinerary.total_duration,
        booked_at: itinerary.booked_at,
        flights: segments,
        passengers: passengers,
        pnr: bookings.length > 0 ? bookings[0].pnr : null,  // Include PNR if available
        booking_status: bookings.length > 0 ? bookings[0].booking_status : 'unknown'
      });
    }

    res.json({ history: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking history' });
  }
};

exports.cancelBooking = async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`Attempting to cancel booking ${bookingId} for user ${userId}`);
    
    // Check if booking belongs to user
    const booking = await knex('bookings')
      .join('itineraries', 'bookings.itinerary_id', 'itineraries.id')
      .where('bookings.id', bookingId)
      .andWhere('itineraries.user_id', userId)
      .first();

    if (!booking) {
      console.log(`Booking ${bookingId} not found or doesn't belong to user ${userId}`);
      return res.status(404).json({ message: 'Booking not found or not yours' });
    }

    // Check if booking is already cancelled
    if (booking.booking_status === 'cancelled') {
      console.log(`Booking ${bookingId} is already cancelled`);
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Get passenger count for this booking
    const passengerCount = await knex('passengers')
      .where({ booking_id: bookingId })
      .count('* as count')
      .first();

    const numberOfPassengers = parseInt(passengerCount.count);
    
    console.log(`Cancelling booking ${bookingId} with ${numberOfPassengers} passengers`);

    // Start a transaction for consistency
    const trx = await knex.transaction();

    try {
      // Get the flight segments associated with the booking
      const itinerarySegments = await trx('itinerary_segments')
        .join('flight_segments', 'itinerary_segments.segment_id', 'flight_segments.id')
        .where('itinerary_segments.itinerary_id', booking.itinerary_id)
        .select('itinerary_segments.segment_id', 'itinerary_segments.flight_date');

      console.log(`Found ${itinerarySegments.length} flight segments for booking ${bookingId}`);

      // For each segment, increase available seats by the number of passengers
      for (const segment of itinerarySegments) {
        await trx('flight_schedules')
          .where({ 
            segment_id: segment.segment_id,
            flight_date: segment.flight_date
          })
          .increment('available_seats', numberOfPassengers);
        
        console.log(`Returned ${numberOfPassengers} seats to flight schedule for segment ${segment.segment_id} on ${segment.flight_date}`);
      }

      // Mark all passengers as cancelled
      // Note: If your passengers table doesn't have a status column yet, 
      // you'll need to add it via a migration first
      await trx('passengers')
        .where({ booking_id: bookingId })
        .update({ status: 'cancelled' });

      console.log(`Marked ${numberOfPassengers} passengers as cancelled for booking ${bookingId}`);

      // Now cancel the booking
      await trx('bookings')
        .where({ id: bookingId })
        .update({ booking_status: 'cancelled' });

      console.log(`Successfully marked booking ${bookingId} as cancelled`);

      // Commit the transaction
      await trx.commit();
      
      // Send cancellation email
      try {
        await sendCancellationEmail(booking.email, booking.pnr);
        console.log(`Sent cancellation email for booking ${bookingId} to ${booking.email}`);
      } catch (emailError) {
        console.error(`Failed to send cancellation email, but booking was cancelled:`, emailError);
        // Continue with the response even if email fails
      }

      return res.status(200).json({ 
        message: 'Booking cancelled successfully',
        refundAmount: booking.total_price // You can calculate actual refund based on your policies
      });
    } catch (trxError) {
      // If any step fails, roll back the entire transaction
      console.error(`Transaction error during cancellation of booking ${bookingId}:`, trxError);
      await trx.rollback();
      throw trxError;
    }
  } catch (error) {
    console.error(`Error cancelling booking ${bookingId}:`, error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};

// Helper function to send cancellation email
const sendCancellationEmail = async (email, pnr) => {
  try {
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Use your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Generate cancellation email HTML
    const cancellationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d32f2f;">Booking Cancellation Confirmation</h1>
        <p>Dear Customer,</p>
        <p>Your booking with PNR <strong>${pnr}</strong> has been successfully cancelled.</p>
        <p>If your booking is eligible for a refund, it will be processed according to our refund policy and credited back to your original payment method within 7-10 business days.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p>Thank you for choosing our service. We hope to serve you again in the future.</p>
        <p style="font-size: 12px; color: #757575; margin-top: 30px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Booking Cancellation Confirmation - PNR: ${pnr}`,
      html: cancellationHtml,
    });

    console.log('Cancellation confirmation sent successfully to', email);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw new Error('Failed to send cancellation email');
  }
};

exports.createBooking = async (req, res) => {
  try {
    console.log('Received booking request:', req.body);
    const { flight_number, date, email, contact_number, passengers, user_id } = req.body;

    // Validate input
    if (!flight_number || !date || !email || !contact_number || !passengers || passengers.length === 0) {
      return res.status(400).json({ error: 'All fields are required, including passengers' });
    }

    console.log('Processing booking...');

    // Start a transaction
    const trx = await knex.transaction();

    try {
      // Get flight segment
      console.log('Looking for flight with number:', flight_number);
      const flightSegment = await trx('flight_segments')
        .where({ flight_number })
        .first();

      console.log('Flight segment found:', flightSegment);

      if (!flightSegment) {
        await trx.rollback();
        return res.status(404).json({ error: 'Flight not found' });
      }

      // Get the flight schedule for the specified date
      const flightSchedule = await trx('flight_schedules')
        .where({ 
          segment_id: flightSegment.id,
          flight_date: date
        })
        .first();
      
      console.log('Flight schedule found:', flightSchedule);
      
      if (!flightSchedule) {
        await trx.rollback();
        return res.status(404).json({ error: 'No flight available for the specified date' });
      }
      
      // Check if enough seats are available
      if (flightSchedule.available_seats < passengers.length) {
        await trx.rollback();
        return res.status(400).json({ error: `Only ${flightSchedule.available_seats} seats available` });
      }
      
      // Update available seats
      await trx('flight_schedules')
        .where({ 
          segment_id: flightSegment.id,
          flight_date: date
        })
        .decrement('available_seats', passengers.length);
      
      console.log(`Decreased ${passengers.length} seats from flight schedule`);

      // Calculate total price (for all passengers)
      const totalPrice = flightSegment.price * passengers.length;
      console.log('Total price calculated:', totalPrice);

      let durationInMinutes = 0;
      if (flightSegment.departure_time && flightSegment.arrival_time) {
      // Parse times (assuming they're stored as HH:MM:SS strings)
        const departureTime = flightSegment.departure_time.split(':');
        const arrivalTime = flightSegment.arrival_time.split(':');
        
        // Convert to minutes since midnight
        const departureMinutes = parseInt(departureTime[0]) * 60 + parseInt(departureTime[1]);
        let arrivalMinutes = parseInt(arrivalTime[0]) * 60 + parseInt(arrivalTime[1]);
        
        // Handle flights crossing midnight
        if (arrivalMinutes < departureMinutes) {
          arrivalMinutes += 24 * 60; // Add a day's worth of minutes
        }
        
        durationInMinutes = arrivalMinutes - departureMinutes;
      }

      // Format duration as HH:MM:00
      const hours = Math.floor(durationInMinutes / 60).toString().padStart(2, '0');
      const minutes = (durationInMinutes % 60).toString().padStart(2, '0');
      const durationFormatted = `${hours}:${minutes}:00`;

      console.log(`Calculated flight duration: ${durationFormatted}`);


      // Create an itinerary
      const itineraryResult = await trx('itineraries').insert({
        user_id: user_id,
        total_price: totalPrice,
        total_duration: durationFormatted,
        booked_at: new Date()
      }).returning('id');

      const itineraryId = Number(itineraryResult[0].id || itineraryResult[0]);
      console.log('Itinerary created with ID:', itineraryId);

      // Link flight segment to itinerary
      await trx('itinerary_segments').insert({
        itinerary_id: itineraryId,
        segment_id: Number(flightSegment.id),
        sequence_no: 1,
        flight_date: date
      });

      // Generate a unique PNR
      const pnr = uuidv4().slice(0, 8).toUpperCase();
      console.log('Generated PNR:', pnr);

      // Create booking with the itinerary ID
      const bookingResult = await trx('bookings').insert({
        itinerary_id: itineraryId,
        email,
        contact_number,
        pnr,
        booking_status: 'confirmed'
      }).returning('id');

      const bookingId = Number(bookingResult[0].id || bookingResult[0]);
      console.log('Booking created with ID:', bookingId);

      // Save passenger details
      for (const passenger of passengers) {
        await trx('passengers').insert({
          booking_id: bookingId,
          name: passenger.name,
          age: Number(passenger.age),
          gender: passenger.gender
        });
      }

      console.log('Passengers saved');
      // Simulate payment (for now, assume it's successful)
      console.log('Payment simulated successfully');

      // Commit the transaction
      await trx.commit();
      console.log('Transaction committed successfully');

      // Send ticket via email
      try {
        await sendTicketEmail(email, pnr, flight_number, date, passengers, flightSegment);
        console.log('Ticket email sent successfully');
      } catch (emailError) {
        console.error('Error sending email, but booking was successful:', emailError);
        // Continue with the response even if email fails
      }

      res.status(201).json({ message: 'Booking confirmed', pnr });
    } catch (trxError) {
      console.error('Transaction error:', trxError);
      await trx.rollback();
      throw trxError;
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking: ' + error.message });
  }
};
// Function to send ticket via email
const sendTicketEmail = async (email, pnr, flightNumber, date, passengers, flightSegment) => {
  try {
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Format the date nicely
    const flightDate = new Date(date);
    const formattedDate = flightDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    function formatTime(timeStr) {
      if (!timeStr) return "N/A";
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${minutes} ${suffix}`;
    }
    
    // Generate passenger list
    const passengerList = passengers.map((p, index) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eaeaea;">${index + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eaeaea;">${p.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eaeaea;">${p.age}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eaeaea;">${p.gender}</td>
      </tr>
    `).join('');
    
    // Generate ticket HTML with beautiful styling
    const ticketHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Flight Ticket</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3498db, #1a5276); padding: 20px; color: white; text-align: center;">
            <h1 style="margin: 0; font-weight: 600;">Your Flight Ticket is Confirmed!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Thank you for choosing our service</p>
          </div>
          
          <!-- Ticket Info -->
          <div style="padding: 25px; background-color: #f9f9f9; border-bottom: 1px dashed #ccc; position: relative;">
            <div style="position: absolute; top: 25px; right: 25px; background-color: #e74c3c; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; letter-spacing: 1px;">
              PNR: ${pnr}
            </div>
            
            <h2 style="margin: 0 0 20px; color: #2c3e50;">Flight Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 5px 0;"><strong>Airline:</strong></td>
                <td style="padding: 5px 0;">${flightSegment.airline}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Flight:</strong></td>
                <td style="padding: 5px 0;"><span style="color: #3498db; font-weight: bold;">${flightNumber}</span></td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Date:</strong></td>
                <td style="padding: 5px 0;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Route:</strong></td>
                <td style="padding: 5px 0;">${flightSegment.departure_airport} → ${flightSegment.arrival_airport}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Departure:</strong></td>
                <td style="padding: 5px 0;">
                  <span style="font-weight: 600;">${formatTime(flightSegment.departure_time)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Arrival:</strong></td>
                <td style="padding: 5px 0;">
                  <span style="font-weight: 600;">${formatTime(flightSegment.arrival_time)}</span>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Passenger Info -->
          <div style="padding: 25px;">
            <h2 style="margin: 0 0 20px; color: #2c3e50;">Passenger Information</h2>
            
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background-color: #f2f6f9;">
                  <th style="padding: 12px; border-bottom: 2px solid #ddd;">#</th>
                  <th style="padding: 12px; border-bottom: 2px solid #ddd;">Name</th>
                  <th style="padding: 12px; border-bottom: 2px solid #ddd;">Age</th>
                  <th style="padding: 12px; border-bottom: 2px solid #ddd;">Gender</th>
                </tr>
              </thead>
              <tbody>
                ${passengerList}
              </tbody>
            </table>
          </div>
          
          <!-- Important Info -->
          <div style="background-color: #f8f4e5; padding: 20px; margin: 0 25px 25px; border-left: 4px solid #f39c12;">
            <h3 style="margin: 0 0 10px; color: #d35400;">Important Information</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Please arrive at the airport at least 2 hours before departure.</li>
              <li>Carry a valid photo ID for security check.</li>
              <li>Baggage allowance: Check-in: 15kg, Cabin: 7kg.</li>
              <li>Web check-in opens 48 hours before departure.</li>
            </ul>
          </div>
          
          <!-- Barcode -->
          <div style="text-align: center; padding: 15px 25px 35px; border-top: 1px solid #eee;">
            <p style="margin-bottom: 15px; color: #7f8c8d; font-size: 14px;">Scan this code at the airport kiosk</p>
            <div style="background-image: url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pnr}'); height: 120px; width: 120px; margin: 0 auto; background-size: contain; background-repeat: no-repeat; background-position: center;"></div>
            <p style="margin-top: 15px; color: #7f8c8d; font-size: 14px;">Reference: ${pnr}</p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #2c3e50; color: white; padding: 15px 25px; text-align: center; font-size: 14px;">
            <p style="margin: 0 0 10px;">Need help? Contact our support team at support@flightbookingsystem.com</p>
            <p style="margin: 0;">© 2025 Flight Booking System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Helper function to format time
    

    // Send email
    await transporter.sendMail({
      from: `"Flight Booking System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✈️ Your Flight Ticket - PNR: ${pnr}`,
      html: ticketHtml,
    });

    console.log('Beautiful ticket email sent successfully to', email);
  } catch (error) {
    console.error('Error sending ticket email:', error);
    throw new Error('Failed to send ticket email');
  }
};

exports.getBookingByPNR = async (req, res) => {
  try {
    const { pnr } = req.params;

    // Validate input
    if (!pnr) {
      return res.status(400).json({ error: 'PNR is required' });
    }

    // Find booking by PNR
    const booking = await knex('bookings')
      .where({ pnr })
      .first();

    if (!booking) {
      return res.status(404).json({ error: 'No booking found with this PNR' });
    }

    // Get flight details
    const flightDetails = await knex('flight_segments')
      .join('itinerary_segments', 'flight_segments.id', 'itinerary_segments.segment_id')
      .where('itinerary_segments.itinerary_id', booking.itinerary_id)
      .select(
        'flight_segments.flight_number',
        'flight_segments.airline',
        'flight_segments.departure_airport',
        'flight_segments.arrival_airport',
        'flight_segments.departure_time',
        'flight_segments.arrival_time',
        'flight_segments.price'
      )
      .first();

    // Get passenger details
    const passengers = await knex('passengers')
      .where({ booking_id: booking.id })
      .select('name', 'age', 'gender');

    const response = {
      pnr: booking.pnr,
      booking_status: booking.booking_status,
      date: booking.date,
      email: booking.email,
      contact_number: booking.contact_number,
      ...flightDetails,
      passengers
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching booking by PNR:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
};