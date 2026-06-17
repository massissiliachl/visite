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

  description: {
    type: DataTypes.TEXT,
  },

  longDescription: {
    type: DataTypes.TEXT,
  },

  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  priceHaute: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  priceBasse: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  isDevis: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },

  popular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  ambiance: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('ambiance');
      try {
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('ambiance', JSON.stringify(value || []));
    }
  },

  features: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('features');
      try {
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('features', JSON.stringify(value || []));
    }
  },

  images: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('images');
      try {
        return raw ? JSON.parse(raw) : [];
      } catch {
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