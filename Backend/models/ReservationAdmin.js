// ReservationAdmin.js - VERSION FINALE CORRIGÉE
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
  
  // ✅ Seul le champ en minuscules existe en base
  totalapayer: {
    type: DataTypes.DECIMAL(10,2),
    field: "totalapayer",
    defaultValue: 0,
    allowNull: false
  },
  
  versement: {
    type: DataTypes.DECIMAL(10,2),
    field: "versement",
    defaultValue: 0,
    allowNull: false
  },
  
  resteapayer: {
    type: DataTypes.DECIMAL(10,2),
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
  timestamps: true,
  
  // ✅ Hook pour normaliser les noms de champs
  hooks: {
    beforeValidate: (instance, options) => {
      // Copier les valeurs camelCase vers snake_case
      if (instance.dataValues.totalAPayer !== undefined) {
        instance.totalapayer = instance.dataValues.totalAPayer;
        delete instance.dataValues.totalAPayer;
      }
      
      if (instance.dataValues.resteAPayer !== undefined) {
        instance.resteapayer = instance.dataValues.resteAPayer;
        delete instance.dataValues.resteAPayer;
      }
      
      // Gérer le cas où Note est envoyé
      if (instance.dataValues.Note !== undefined) {
        instance.note = instance.dataValues.Note;
        delete instance.dataValues.Note;
      }
    }
  }
});

module.exports = ReservationAdmin;