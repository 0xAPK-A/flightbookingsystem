require('dotenv').config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'arnab',
      password: process.env.DB_PASSWORD || 'APKA',
      database: process.env.DB_NAME || 'flight_booking_db',
    },
    migrations: {
      directory: './migrations',
    },
  },
};
