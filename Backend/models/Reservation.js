const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Reservation = sequelize.define('Reservation', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },

  prenom: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false
  },

  telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },

  adresse: {
    type: DataTypes.STRING,
    allowNull: true
  },

  nb_personnes: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },

  type_reservation: {
    type: DataTypes.STRING
  },

  nom_item: {
    type: DataTypes.STRING
  },

  prix_total: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },

  acompte_30pct: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },

  date_depart: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: 'en_attente'
  },

  // ===== PAIEMENT =====
  mode_paiement: {
    type: DataTypes.STRING,
    defaultValue: 'BaridiMob'
  },

  transaction_ref: {
    type: DataTypes.STRING,
    allowNull: true
  },

  paiement_statut: {
    type: DataTypes.STRING,
    defaultValue: 'non_saisi'
  },

  demandes_speciales: {
    type: DataTypes.TEXT
  },

  payment_proof: {
    type: DataTypes.STRING,
    allowNull: true
  },
}, {
  tableName: 'reservations'
});

module.exports = Reservation;