const toBool = (value) => value === true || value === "true";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapProperty = (propertyDoc) => {
  const property = propertyDoc.toObject ? propertyDoc.toObject() : propertyDoc;
  const agent = property.agent || {};

  return {
    _id: property._id,
    title: property.title,
    description: property.description,
    price: property.price,
    priceType: property.priceType,
    type: property.type,
    status: property.status,
    location: property.location,
    features: property.features,
    images: property.images || [],
    agent: {
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      avatar: agent.avatar,
      agency: agent.agency,
    },
    isApproved: property.isApproved,
    moderationStatus: property.moderationStatus || (property.isApproved ? "approved" : "pending"),
    rejectionReason: property.rejectionReason || "",
    isFeatured: property.isFeatured,
    views: property.views,
    favorites: property.favorites,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
};

module.exports = { toBool, toNumber, mapProperty };
