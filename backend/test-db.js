const pool = require('./src/db'); // Adjusted path

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error executing query', err.stack);
  } else {
    console.log('Database time:', res.rows[0]);
  }
  pool.end();
});
