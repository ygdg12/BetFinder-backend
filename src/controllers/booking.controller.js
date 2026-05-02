const Booking = require("../models/Booking");
const Property = require("../models/Property");
const { mapBooking } = require("../utils/booking");

const bookingPopulate = [
  { path: "property", select: "title images location" },
  { path: "buyer", select: "name email phone" },
  { path: "agent", select: "name email" },
];

const createBooking = async (req, res, next) => {
  try {
    const { propertyId, date, time, notes } = req.body;
    const property = await Property.findById(propertyId);
    if (!property || !property.isApproved) {
      res.status(404);
      throw new Error("Property not available");
    }

    const booking = await Booking.create({
      property: property._id,
      buyer: req.user._id,
      agent: property.agent,
      date,
      time,
      notes: notes || "",
    });

    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    res.status(201).json(mapBooking(populated));
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ buyer: req.user._id }).populate(bookingPopulate).sort({ createdAt: -1 });
    res.json(bookings.map(mapBooking));
  } catch (error) {
    next(error);
  }
};

const getAgentBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ agent: req.user._id }).populate(bookingPopulate).sort({ createdAt: -1 });
    res.json(bookings.map(mapBooking));
  } catch (error) {
    next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    const isOwner = String(booking.agent) === String(req.user._id);
    if (!isOwner && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Forbidden");
    }

    booking.status = req.body.status;
    await booking.save();
    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    res.json(mapBooking(populated));
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookings, getAgentBookings, updateBookingStatus };
