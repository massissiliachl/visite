const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Reservation = sequelize.define('Reservation', {
  nom: { type: DataTypes.STRING, allowNull: false },
  prenom: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER },
  email: { type: DataTypes.STRING },
  telephone: { type: DataTypes.STRING },
  adresse: { type: DataTypes.STRING },
  nb_personnes: { type: DataTypes.INTEGER, defaultValue: 1 },
  type_reservation: { type: DataTypes.STRING },
  nom_item: { type: DataTypes.STRING },
  prix_total: { type: DataTypes.FLOAT, defaultValue: 0 },
  date_depart: { type: DataTypes.DATE },
  regimen: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'en_attente' },
}, {
  tableName: 'reservations'
});

module.exports = Reservation;
