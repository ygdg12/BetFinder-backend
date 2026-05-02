const { body } = require("express-validator");

const registerRules = [
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").optional().isIn(["buyer", "agent"]),
];

const loginRules = [body("email").isEmail().normalizeEmail(), body("password").notEmpty()];

const profileRules = [
  body("name").optional().isString().trim().notEmpty(),
  body("phone").optional().isString(),
  body("avatar").optional().isString(),
  body("agency").optional().isString(),
  body("bio").optional().isString(),
];

module.exports = { registerRules, loginRules, profileRules };
