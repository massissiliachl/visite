const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('visitbejaia', 'postgres', 'massissilia06', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false, // pour ne pas afficher toutes les requêtes SQL
});

module.exports = sequelize;
