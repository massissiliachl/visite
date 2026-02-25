const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('visitbejaia', 'postgres', 'massissilia06', {
  host: 'localhost',
  dialect: 'postgres',
});

sequelize.authenticate()
  .then(() => console.log("Connexion PostgreSQL réussie !"))
  .catch(err => console.error("Erreur connexion :", err));

module.exports = sequelize;
