const knexLib = require("knex");
const knexConfig = require("./knexfile");

const knex = knexLib(knexConfig.development); // pick correct env config
module.exports = knex;
