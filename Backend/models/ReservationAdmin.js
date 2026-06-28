const { DataTypes } = require("sequelize");
const sequelize = require("./database");
console.log("🔥🔥🔥 MODELE CHARGÉ - VERSION CAMELCASE -", new Date().toISOString());
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

  // ✅ Attribut JS en camelCase, mappé vers la colonne SQL existante en minuscule
  totalAPayer: {
    type: DataTypes.DECIMAL(10, 2),
    field: "totalapayer",
    defaultValue: 0,
    allowNull: false
  },
  
  versement: {
    type: DataTypes.DECIMAL(10, 2),
    field: "versement",
    defaultValue: 0,
    allowNull: false
  },
  
  resteAPayer: {
    type: DataTypes.DECIMAL(10, 2),
    field: "resteapayer",
    defaultValue: 0,
    allowNull: false
  },
  
  note: {
    type: DataTypes.TEXT,
    field: "note",
    allowNull: true
  }
}, {
  tableName: "ReservationAdmins",
  freezeTableName: true, 
  timestamps: true
  // Pas de hooks : le contrôleur envoie déjà les bons noms d'attributs
  // (totalAPayer, resteAPayer) qui sont mappés nativement par Sequelize
  // vers les colonnes SQL "totalapayer" / "resteapayer" via `field`.
});

module.exports = ReservationAdmin;