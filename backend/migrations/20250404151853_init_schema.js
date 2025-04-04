exports.up = function(knex) {
    return knex.schema
      .createTable('users', (table) => {
        table.increments('id').primary();
        table.text('name').notNullable();
        table.text('email').unique().notNullable();
        table.text('password').notNullable();
        table.boolean('is_verified').defaultTo(false);
        table.text('verification_token');
      })
      .createTable('aircraft', (table) => {
        table.increments('id').primary();
        table.string('tail_number', 20).unique().notNullable();
        table.string('model', 50);
        table.integer('seating_capacity');
        table.enu('status', ['active', 'maintenance', 'decommissioned']).defaultTo('active');
      })
      .createTable('flight_segments', (table) => {
        table.increments('id').primary();
        table.string('flight_number', 20).notNullable();
        table.string('airline', 100).notNullable();
        table.string('departure_airport', 50).notNullable();
        table.string('arrival_airport', 50).notNullable();
        table.timestamp('departure_time').notNullable();
        table.timestamp('arrival_time').notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.integer('available_seats').notNullable();
        table.integer('aircraft_id').references('id').inTable('aircraft');
        table.timestamp('created_at').defaultTo(knex.fn.now());
      })
      .createTable('itineraries', (table) => {
        table.increments('id').primary();
        table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.decimal('total_price', 10, 2).notNullable();
        table.specificType('total_duration', 'interval');
        table.timestamp('booked_at').defaultTo(knex.fn.now());
      })
      .createTable('itinerary_segments', (table) => {
        table.increments('id').primary();
        table.integer('itinerary_id').references('id').inTable('itineraries').onDelete('CASCADE');
        table.integer('segment_id').references('id').inTable('flight_segments').onDelete('CASCADE');
        table.integer('sequence_no');
        table.specificType('layover_duration', 'interval');
      })
      .createTable('bookings', (table) => {
        table.increments('id').primary();
        table.integer('itinerary_id').references('id').inTable('itineraries').onDelete('CASCADE');
        table.enu('booking_status', ['confirmed', 'cancelled']).defaultTo('confirmed');
        table.timestamp('booked_at').defaultTo(knex.fn.now());
      })
      .createTable('payments', (table) => {
        table.increments('id').primary();
        table.integer('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
        table.decimal('amount', 10, 2).notNullable();
        table.enu('payment_status', ['pending', 'paid', 'failed']).defaultTo('pending');
        table.timestamp('paid_at');
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('payments')
      .dropTableIfExists('bookings')
      .dropTableIfExists('itinerary_segments')
      .dropTableIfExists('itineraries')
      .dropTableIfExists('flight_segments')
      .dropTableIfExists('aircraft')
      .dropTableIfExists('users');
  };
  