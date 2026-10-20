const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const parseJson = (raw, fallback) => {
  if (raw == null || raw === "") return fallback;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const Activity = sequelize.define(
  "Activity",
  {
    slug: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    basePrice: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0",
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "mer",
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "fa-star",
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "assets/images/all.jpg",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      field: "description",
    },
    hasChild: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    childPrice: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    activityNote: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        return parseJson(this.getDataValue("activityNote"), []);
      },
      set(value) {
        this.setDataValue("activityNote", JSON.stringify(value || []));
      },
    },
    options: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        return parseJson(this.getDataValue("options"), []);
      },
      set(value) {
        this.setDataValue("options", JSON.stringify(value || []));
      },
    },
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "activities",
    timestamps: true,
  }
);

module.exports = Activity;
