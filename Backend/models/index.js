const sequelize = require("./database");
const Reservation = require("./Reservation");
const Property = require("./Property");              // ✅ Doit être présent
const PropertyReservation = require("./PropertyReservation"); // ✅ Doit être présent

// Associations
Property.hasMany(PropertyReservation, {
  foreignKey: "propertyId",
  onDelete: "CASCADE",
});

PropertyReservation.belongsTo(Property, {
  foreignKey: "propertyId",
});

module.exports = {
  sequelize,
  Reservation,
  Property,           // ✅ Doit être exporté
  PropertyReservation, // ✅ Doit être exporté
};