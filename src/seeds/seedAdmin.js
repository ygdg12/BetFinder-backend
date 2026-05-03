require("dotenv").config();
const mongoose = require("mongoose");
const validator = require("validator");
const { connectDB } = require("../config/db");
const User = require("../models/User");

const normalizeAdminEmail = (raw) => {
  const trimmed = String(raw || "").trim();
  if (!trimmed) {
    return "";
  }
  // Matches login: body().isEmail().normalizeEmail() → validator.normalizeEmail(value) with no options
  return validator.normalizeEmail(trimmed) || trimmed.toLowerCase();
};

const seedAdmin = async () => {
  await connectDB();

  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const adminEmail = normalizeAdminEmail(process.env.ADMIN_EMAIL || "admin@betfinder.com");

  if (!adminEmail) {
    console.error("ADMIN_EMAIL is empty after normalization");
    await mongoose.disconnect();
    process.exit(1);
  }

  const resetPassword = /^true$/i.test(String(process.env.RESET_ADMIN_PASSWORD || ""));

  const existing = await User.findOne({ email: adminEmail }).select("+password");

  if (existing && existing.role !== "admin") {
    console.error(
      `A user with email ${adminEmail} already exists with role "${existing.role}", not admin. ` +
        "Choose a different ADMIN_EMAIL in .env or delete that user in MongoDB."
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  if (!existing) {
    await User.create({
      name: "Platform Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isVerified: true,
    });
    console.log("Admin created successfully");
    await mongoose.disconnect();
    return;
  }

  if (resetPassword) {
    existing.password = adminPassword;
    await existing.save();
    console.log("Admin password updated (RESET_ADMIN_PASSWORD=true)");
  } else {
    console.log("Admin already exists. Set RESET_ADMIN_PASSWORD=true to re-hash ADMIN_PASSWORD from env.");
  }

  await mongoose.disconnect();
};

seedAdmin().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
