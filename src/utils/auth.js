const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("JWT_SECRET is missing; using temporary development secret.");
    return "dev-temporary-secret";
  }

  throw new Error("JWT_SECRET is not configured");
};

const signToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), {
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
