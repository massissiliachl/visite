// models/Property.js
const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const Property = sequelize.define("Property", {
  id: {
    type: DataTypes.STRING,  // ✅ STRING pour 'v1', 'v2', etc
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  images: DataTypes.TEXT,
}, {
  tableName: "properties",
  timestamps: true,
});

module.exports = Property;