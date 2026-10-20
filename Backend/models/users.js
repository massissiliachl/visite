const { DataTypes } = require('sequelize');
const sequelize = require("./database");

const User = sequelize.define('User', {
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
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  photo: {
    type: DataTypes.STRING,
    allowNull: true
  },

  telephone: {
    type: DataTypes.STRING,
    allowNull: true
  },

  role: {
    type: DataTypes.ENUM('admin', 'employeur', 'proprietaire'),
    defaultValue: 'employeur'
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users'
});

module.exports = User;