const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const ReservationAdmin = sequelize.define("ReservationAdmin", {
  nom: DataTypes.STRING,
  prenom: DataTypes.STRING,
  tel: DataTypes.STRING,
  activite: DataTypes.STRING,
  heure: DataTypes.STRING,
  date: DataTypes.DATEONLY,
});

module.exports = ReservationAdmin;