const jwt = require("jsonwebtoken");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const toPublicUser = (userDoc) => ({
  _id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  phone: userDoc.phone,
  avatar: userDoc.avatar,
  role: userDoc.role,
  agency: userDoc.agency,
  bio: userDoc.bio,
  favorites: userDoc.favorites || [],
  isVerified: userDoc.isVerified,
  createdAt: userDoc.createdAt,
});

module.exports = { signToken, toPublicUser };
