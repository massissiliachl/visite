const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const ReservationAdmin = sequelize.define("ReservationAdmin", {
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  activite: {
    type: DataTypes.STRING,
    allowNull: false
  },
  heure: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  personnes: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },slot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  subslot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  bateau: {
    type: DataTypes.STRING, // "1" ou "2"
    allowNull: true
  },
  
  duree: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = ReservationAdmin;