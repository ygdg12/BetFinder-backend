const express = require("express");
const {
  createBooking,
  getMyBookings,
  getAgentBookings,
  updateBookingStatus,
} = require("../controllers/booking.controller");
const { protect, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createBookingRules, updateBookingStatusRules } = require("../validators/booking.validators");

const router = express.Router();

router.use(protect);
router.post("/", createBookingRules, validate, createBooking);
router.get("/my", getMyBookings);
router.get("/agent", requireRole("agent", "admin"), getAgentBookings);
router.patch("/:id/status", requireRole("agent", "admin"), updateBookingStatusRules, validate, updateBookingStatus);

module.exports = router;
