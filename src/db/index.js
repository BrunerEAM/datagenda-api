
//Esta linha importa a classe Pool do módulo pg. A classe Pool é fundamental para gerenciar conexões ao seu banco de dados PostgreSQL de forma eficiente, permitindo que você reutilize conexões em vez de criar novas a cada vez que precisa interagir com o banco de dados.

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;
