const jwt = require("jsonwebtoken");

const isDeployedEnvironment = () =>
  process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (!isDeployedEnvironment()) {
    console.warn("JWT_SECRET is missing; using temporary development secret.");
    return "dev-temporary-secret";
  }

  throw new Error("JWT_SECRET is not configured");
};

const signToken = (id) => {
  const subject = id && typeof id.toString === "function" ? id.toString() : String(id);
  return jwt.sign({ id: subject }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

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

module.exports = { signToken, toPublicUser, getJwtSecret };
