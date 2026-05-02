const User = require("../models/User");
const { signToken, toPublicUser } = require("../utils/auth");

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error("Email already in use");
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "buyer",
      phone: phone || "",
    });

    const freshUser = await User.findById(user._id);
    res.status(201).json({
      user: toPublicUser(freshUser),
      token: signToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    res.json({
      user: toPublicUser(user),
      token: signToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "avatar", "agency", "bio"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, updateProfile };
