// models/PropertyReservation.js
const { DataTypes } = require('sequelize');
const sequelize = require("./database");

const PropertyReservation = sequelize.define('PropertyReservation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  propertyId: {
    type: DataTypes.STRING,  // ✅ STRING pour correspondre à Property.id
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date_arrivee: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  date_depart: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  nb_personnes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  prix_total: {
    type: DataTypes.FLOAT,
    allowNull: false
  
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'en_attente',
  },
  payment_status: {
    type: DataTypes.STRING,
    defaultValue: 'non_paye',
  },
  payment_proof: DataTypes.TEXT,
  message: DataTypes.TEXT,
}, {
  tableName: 'property_reservations',
  timestamps: true,
});

module.exports = PropertyReservation;