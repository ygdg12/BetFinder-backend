const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const { mapProperty } = require("../utils/property");

const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalListings, pendingApproval, totalBookings] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Property.countDocuments({
        $or: [{ moderationStatus: "pending" }, { moderationStatus: { $exists: false }, isApproved: false }],
      }),
      Booking.countDocuments(),
    ]);

    res.json({
      totalUsers,
      totalListings,
      pendingApproval,
      totalBookings,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminProperties = async (req, res, next) => {
  try {
    const status = req.query.status;
    const filters = {};

    if (status === "pending") {
      filters.$or = [{ moderationStatus: "pending" }, { moderationStatus: { $exists: false }, isApproved: false }];
    } else if (status === "approved") {
      filters.$or = [{ moderationStatus: "approved" }, { moderationStatus: { $exists: false }, isApproved: true }];
    } else if (status === "rejected") {
      filters.moderationStatus = "rejected";
    }

    const properties = await Property.find(filters).populate("agent", "name email phone avatar agency").sort({ createdAt: -1 });
    res.json(properties.map(mapProperty));
  } catch (error) {
    next(error);
  }
};

const approveAdminProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, moderationStatus: "approved", rejectionReason: "" },
      { new: true }
    ).populate("agent", "name email phone avatar agency");

    if (!property) {
      res.status(404);
      throw new Error("Property not found");
    }

    res.json(mapProperty(property));
  } catch (error) {
    next(error);
  }
};

const rejectAdminProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        moderationStatus: "rejected",
        rejectionReason: (req.body.reason || "").trim(),
      },
      { new: true }
    ).populate("agent", "name email phone avatar agency");

    if (!property) {
      res.status(404);
      throw new Error("Property not found");
    }

    res.json(mapProperty(property));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminStats, getAdminProperties, approveAdminProperty, rejectAdminProperty };
