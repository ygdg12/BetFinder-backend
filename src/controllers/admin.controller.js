const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");

const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalListings, pendingApproval, totalBookings] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Property.countDocuments({ isApproved: false }),
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

module.exports = { getAdminStats };
