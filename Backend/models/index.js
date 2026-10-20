const sequelize = require("./database");
const Reservation = require("./Reservation");
const Property = require("./Property");          
const PropertyReservation = require("./PropertyReservation"); 
const ReservationAdmin = require("./ReservationAdmin");
const users = require("./users");
const Activity = require("./Activity");

// Associations
Property.hasMany(PropertyReservation, {
  foreignKey: "propertyId",
  onDelete: "CASCADE",
});

PropertyReservation.belongsTo(Property, {
  foreignKey: "propertyId",
});

users.hasMany(Property, {
  foreignKey: "ownerId",
  as: "properties",
});

Property.belongsTo(users, {
  foreignKey: "ownerId",
  as: "owner",
});

module.exports = {
  sequelize,
  Reservation,
  Property,           
  PropertyReservation,
  ReservationAdmin,
  users,
  Activity,
};