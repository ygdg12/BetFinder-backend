const { body } = require("express-validator");

const registerRules = [
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["buyer", "agent"]).withMessage("role must be buyer or agent"),
  body("intent").isIn(["buy", "sell"]).withMessage("intent must be buy or sell"),
  body("phone").optional().trim().isString(),
  body().custom((_, { req }) => {
    const { role, intent } = req.body;
    if (role === "buyer" && intent !== "buy") {
      throw new Error('role "buyer" must pair with intent "buy"');
    }
    if (role === "agent" && intent !== "sell") {
      throw new Error('role "agent" must pair with intent "sell"');
    }
    return true;
  }),
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
