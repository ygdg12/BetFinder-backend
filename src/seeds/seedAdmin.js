require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const seedAdmin = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@betfinder.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log("Admin already exists");
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: "Platform Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    isVerified: true,
  });

  console.log("Admin created successfully");
  await mongoose.disconnect();
};

seedAdmin().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
