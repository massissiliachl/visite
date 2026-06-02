// models/Property.js
const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const Property = sequelize.define("Property", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
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
  images: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('images');
      try {
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('images', JSON.stringify(value || []));
    }
  },
}, {
  tableName: "properties",
  timestamps: true,
});

module.exports = Property;