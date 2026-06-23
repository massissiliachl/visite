const { DataTypes } = require('sequelize');
const sequelize = require("./database"); // <-- modifié ici

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
  },
  // NOUVEAUX CHAMPS
  item_type: { 
    type: DataTypes.ENUM('activity', 'property'), 
    allowNull: false,
    defaultValue: 'activity'
  },
  item_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true
  }
}, {
  tableName: 'blocked',
  timestamps: true
});
module.exports = Blocked;

