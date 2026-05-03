const validator = require("validator");

/**
 * Built-in admin for /auth/login — works without Render env seeds.
 * CHANGE BOTH VALUES before trusting this deployment publicly (they are committed in source).
 */
const RAW_LOGIN_EMAIL = "admin@betfinder.com";
const HARDCODED_PASSWORD = "Admin123!";

const hardcodedAdminEmail =
  validator.normalizeEmail(RAW_LOGIN_EMAIL.trim()) || RAW_LOGIN_EMAIL.trim().toLowerCase();

function normalizeEmailInput(email) {
  const trimmed = String(email || "").trim();
  return validator.normalizeEmail(trimmed) || trimmed.toLowerCase();
}

function isHardcodedAdminLogin(emailFromBody, plainPassword) {
  return (
    normalizeEmailInput(emailFromBody) === hardcodedAdminEmail &&
    String(plainPassword || "") === HARDCODED_PASSWORD
  );
}

function hardcodedAdminCreateFields() {
  return {
    name: "Platform Admin",
    email: hardcodedAdminEmail,
    password: HARDCODED_PASSWORD,
    role: "admin",
    isVerified: true,
  };
}

module.exports = {
  hardcodedAdminEmail,
  isHardcodedAdminLogin,
  hardcodedAdminCreateFields,
};
