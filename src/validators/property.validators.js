const { body, query } = require("express-validator");

const propertyWriteRules = [
  body("title").trim().notEmpty(),
  body("description").trim().notEmpty(),
  body("price").isNumeric(),
  body("priceType").isIn(["sale", "rent"]),
  body("type").isIn(["house", "apartment", "land", "office", "villa", "studio"]),
  body("city").trim().notEmpty(),
  body("area").trim().notEmpty(),
  body("address").trim().notEmpty(),
  body("bedrooms").isNumeric(),
  body("bathrooms").isNumeric(),
  body("size").isNumeric(),
];

const propertyQueryRules = [
  query("priceType").optional().isIn(["sale", "rent"]),
  query("sort").optional().isIn(["newest", "price-asc", "price-desc", "popular"]),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
];

module.exports = { propertyWriteRules, propertyQueryRules };
