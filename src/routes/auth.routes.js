const express = require("express");
const { register, login, updateProfile } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { registerRules, loginRules, profileRules } = require("../validators/auth.validators");

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.put("/profile", protect, profileRules, validate, updateProfile);

module.exports = router;
