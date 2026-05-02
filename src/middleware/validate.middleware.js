const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  res.status(400).json({
    message: "Validation failed",
    errors: errors.array(),
  });
};

module.exports = validate;
