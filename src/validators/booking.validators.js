const { body } = require("express-validator");

const createBookingRules = [
  body("propertyId").isMongoId(),
  body("date").isString().notEmpty(),
  body("time").isString().notEmpty(),
  body("notes").optional().isString(),
];

const updateBookingStatusRules = [
  body("status").isIn(["pending", "confirmed", "cancelled", "completed"]),
];

module.exports = { createBookingRules, updateBookingStatusRules };
