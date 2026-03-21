

require("dotenv").config();


module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    },
    migrations: {
      directory: __dirname + "/src/db/migrations"
    },
    seeds: {
      directory: __dirname + "/seeds"
    },
    pool: { min: 2, max: 10 }
  },

  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: __dirname + "/src/db/migrations"
    },
    seeds: {
      directory: __dirname + "/seeds"
    },
    pool: { min: 2, max: 10 },
    ssl: {
      rejectUnauthorized: false
    }
  }
};