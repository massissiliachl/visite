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
  },
  slot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subslot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bateau: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duree: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalapayer: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  versement: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  resteapayer: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "ReservationAdmins",
  timestamps: true
});

module.exports = ReservationAdmin;
