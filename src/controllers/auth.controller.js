const User = require("../models/User");
const {
  hardcodedAdminEmail,
  isHardcodedAdminLogin,
  hardcodedAdminCreateFields,
} = require("../config/adminCredentials");
const { signToken, toPublicUser } = require("../utils/auth");

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, intent, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error("Email already in use");
    }

    const payload = {
      name: typeof name === "string" ? name.trim() : name,
      email,
      password,
      role,
      intent,
      phone: phone !== undefined && phone !== null && String(phone).trim() !== "" ? String(phone).trim() : "",
    };

    const user = await User.create(payload);

    res.status(201).json({
      user: toPublicUser(user),
      token: signToken(user._id),
    });
  } catch (error) {
    if (error.code === 11000 || error.code === "11000") {
      res.status(400);
      next(new Error("Email already in use"));
      return;
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (isHardcodedAdminLogin(email, password)) {
      let adminUser = await User.findOne({ email: hardcodedAdminEmail });

      if (!adminUser) {
        adminUser = await User.create(hardcodedAdminCreateFields());
      } else if (adminUser.role !== "admin") {
        res.status(401);
        throw new Error("Invalid credentials");
      }

      res.json({
        user: toPublicUser(adminUser),
        token: signToken(adminUser._id),
      });
      return;
    }

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
