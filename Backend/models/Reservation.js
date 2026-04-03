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

  // ===== CHAMPS PAIEMENT MANUEL =====
  mode_paiement: {
    type: DataTypes.ENUM('BaridiMob','CCP','Virement','Espèces','Autre'),
    defaultValue: 'BaridiMob'
  },
  transaction_ref: { type: DataTypes.STRING, allowNull: true },
  paiement_statut: {
    type: DataTypes.ENUM('non_saisi','attente_validation','valide','refuse'),
    defaultValue: 'non_saisi'
  },
  demandes_speciales: { type: DataTypes.TEXT },
}, {
  tableName: 'reservations'
});

module.exports = Reservation;
