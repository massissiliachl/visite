const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // <-- modifié ici

const Blocked = sequelize.define('Blocked', {
  nom_item: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  date: { 
    type: DataTypes.DATEONLY, 
    allowNull: false 
  },
  reason: { 
    type: DataTypes.STRING, 
    defaultValue: 'bloqué par admin' 
  }
}, {
  tableName: 'blocked',
  timestamps: true
});

module.exports = Blocked;
