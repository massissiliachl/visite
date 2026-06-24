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
  totalAPayer: {
    type: DataTypes.DECIMAL(10,2),
    field: "totalapayer",
    defaultValue: 0,
    allowNull:false
  },
  
  versement: {
    type: DataTypes.DECIMAL(10,2),
    field:"versement",
    defaultValue:0,
    allowNull:false
  },
  
  resteAPayer: {
    type: DataTypes.DECIMAL(10,2),
    field:"resteapayer",
    defaultValue:0,
    allowNull:false
  },
  
  note:{
   type:DataTypes.TEXT,
   field:"note"
  }}, {
  tableName: "ReservationAdmins",
  timestamps: true
});

module.exports = ReservationAdmin;
