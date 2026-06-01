const sequelize = require("./database");
const Reservation = require("./Reservation");
const Property = require("./Property");          
const PropertyReservation = require("./PropertyReservation"); 
const ReservationAdmin = require("./ReservationAdmin");
const users = require("./users");
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
  Property,           
  PropertyReservation,
  ReservationAdmin,
  users,
   
};