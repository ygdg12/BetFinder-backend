const mapBooking = (bookingDoc) => {
  const booking = bookingDoc.toObject ? bookingDoc.toObject() : bookingDoc;
  return {
    _id: booking._id,
    property: {
      _id: booking.property?._id,
      title: booking.property?.title,
      images: booking.property?.images || [],
      location: booking.property?.location,
    },
    buyer: {
      _id: booking.buyer?._id,
      name: booking.buyer?.name,
      email: booking.buyer?.email,
      phone: booking.buyer?.phone,
    },
    agent: {
      _id: booking.agent?._id,
      name: booking.agent?.name,
      email: booking.agent?.email,
    },
    date: booking.date,
    time: booking.time,
    status: booking.status,
    notes: booking.notes,
    createdAt: booking.createdAt,
  };
};

module.exports = { mapBooking };
