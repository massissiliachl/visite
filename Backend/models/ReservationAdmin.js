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
  // 🚤 Champs bateau
  slot: {
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
  },
  // 💰 Champs paiement
  totalAPayer: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  versement: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  resteAPayer: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  // 📝 Note / Remarque
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "ReservationAdmins",
  timestamps: true // createdAt et updatedAt automatiques
});

module.exports = ReservationAdmin;