const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    keepAlive: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 5000,
    evict: 1000
  },
  retry: {
    max: 3,
    match: [
      /Connection terminated unexpectedly/i,
      /ECONNRESET/i,
      /EAUTHTIMEOUT/i,
      /SequelizeConnectionError/i,
      /timeout/i
    ]
  },
  logging: false
});

module.exports = sequelize;