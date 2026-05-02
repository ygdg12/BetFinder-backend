const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Property = require("../models/Property");
const User = require("../models/User");
const { toBool, toNumber, mapProperty } = require("../utils/property");

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "betfinder/properties" },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

const buildFilters = (query) => {
  const filters = { isApproved: true };
  if (query.priceType) filters.priceType = query.priceType;
  if (query.type) filters.type = query.type;
  if (query.city) filters["location.city"] = new RegExp(query.city, "i");
  if (query.area) filters["location.area"] = new RegExp(query.area, "i");
  if (query.bedrooms) filters["features.bedrooms"] = { $gte: toNumber(query.bedrooms) };
  if (query.bathrooms) filters["features.bathrooms"] = { $gte: toNumber(query.bathrooms) };
  if (query.furnished !== undefined) filters["features.furnished"] = toBool(query.furnished);
  if (query.amenities) {
    String(query.amenities)
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .forEach((amenity) => {
        filters[`features.${amenity}`] = true;
      });
  }
  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = toNumber(query.minPrice);
    if (query.maxPrice) filters.price.$lte = toNumber(query.maxPrice);
  }
  if (query.minSize || query.maxSize) {
    filters["features.size"] = {};
    if (query.minSize) filters["features.size"].$gte = toNumber(query.minSize);
    if (query.maxSize) filters["features.size"].$lte = toNumber(query.maxSize);
  }
  return filters;
};

const buildSort = (sort) => {
  switch (sort) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "popular":
      return { views: -1, favorites: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
};

const getProperties = async (req, res, next) => {
  try {
    const page = Math.max(toNumber(req.query.page, 1), 1);
    const limit = Math.min(Math.max(toNumber(req.query.limit, 10), 1), 50);
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);

    const [total, properties] = await Promise.all([
      Property.countDocuments(filters),
      Property.find(filters)
        .populate("agent", "name email phone avatar agency")
        .sort(buildSort(req.query.sort))
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      properties: properties.map(mapProperty),
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    next(error);
  }
};

const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate("agent", "name email phone avatar agency");
    if (!property) {
      res.status(404);
      throw new Error("Property not found");
    }

    property.views += 1;
    await property.save();

    res.json(mapProperty(property));
  } catch (error) {
    next(error);
  }
};

const getFeaturedProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ isApproved: true, isFeatured: true })
      .populate("agent", "name email phone avatar agency")
      .sort({ createdAt: -1 })
      .limit(8);

    res.json(properties.map(mapProperty));
  } catch (error) {
    next(error);
  }
};

const buildPropertyPayload = (body, agentId) => ({
  title: body.title,
  description: body.description,
  price: toNumber(body.price),
  priceType: body.priceType,
  type: body.type,
  status: body.status || "available",
  location: {
    address: body.address,
    city: body.city,
    area: body.area,
    country: body.country || "Italy",
    coordinates: {
      lat: toNumber(body.lat),
      lng: toNumber(body.lng),
    },
  },
  features: {
    bedrooms: toNumber(body.bedrooms),
    bathrooms: toNumber(body.bathrooms),
    size: toNumber(body.size),
    floors: toNumber(body.floors),
    garage: toBool(body.garage),
    pool: toBool(body.pool),
    garden: toBool(body.garden),
    balcony: toBool(body.balcony),
    elevator: toBool(body.elevator),
    furnished: toBool(body.furnished),
    parking: toBool(body.parking),
    airConditioning: toBool(body.airConditioning),
  },
  contactPhone: body.contactPhone || "",
  contactEmail: body.contactEmail || "",
  agent: agentId,
});

const createProperty = async (req, res, next) => {
  try {
    const payload = buildPropertyPayload(req.body, req.user._id);
    payload.contactPhone = req.body.contactPhone || req.user.phone || "";
    payload.contactEmail = req.body.contactEmail || req.user.email || "";

    const files = req.files || [];
    payload.images = files.length ? await Promise.all(files.map((f) => uploadToCloudinary(f.buffer))) : [];

    const property = await Property.create(payload);
    const populated = await Property.findById(property._id).populate("agent", "name email phone avatar agency");
    res.status(201).json(mapProperty(populated));
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404);
      throw new Error("Property not found");
    }
    if (req.user.role !== "admin" && String(property.agent) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Forbidden");
    }

    const payload = buildPropertyPayload(req.body, property.agent);
    payload.contactPhone = req.body.contactPhone || property.contactPhone;
    payload.contactEmail = req.body.contactEmail || property.contactEmail;
    payload.images = property.images;

    if (req.files && req.files.length) {
      payload.images = await Promise.all(req.files.map((f) => uploadToCloudinary(f.buffer)));
    }

    Object.assign(property, payload);
    if (req.user.role !== "admin") {
      property.isApproved = false;
    }
    await property.save();

    const populated = await Property.findById(property._id).populate("agent", "name email phone avatar agency");
    res.json(mapProperty(populated));
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404);
      throw new Error("Property not found");
    }
    if (req.user.role !== "admin" && String(property.agent) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Forbidden");
    }

    await property.deleteOne();
    res.json({ message: "Property deleted" });
  } catch (error) {
    next(error);
  }
};

const getMyProperties = async (req, res, next) => {
  try {
    const filters = req.user.role === "admin" ? {} : { agent: req.user._id };
    const properties = await Property.find(filters).populate("agent", "name email phone avatar agency").sort({ createdAt: -1 });
    res.json(properties.map(mapProperty));
  } catch (error) {
    next(error);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404);
      throw new Error("Property not found");
    }

    const user = await User.findById(req.user._id);
    const exists = user.favorites.some((favoriteId) => String(favoriteId) === String(property._id));

    if (exists) {
      user.favorites = user.favorites.filter((favoriteId) => String(favoriteId) !== String(property._id));
      property.favorites = Math.max(property.favorites - 1, 0);
    } else {
      user.favorites.push(property._id);
      property.favorites += 1;
    }

    await Promise.all([user.save(), property.save()]);
    res.json({ isFavorite: !exists });
  } catch (error) {
    next(error);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("favorites");
    const properties = await Property.find({ _id: { $in: user.favorites }, isApproved: true })
      .populate("agent", "name email phone avatar agency")
      .sort({ createdAt: -1 });
    res.json(properties.map(mapProperty));
  } catch (error) {
    next(error);
  }
};

const approveProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true }).populate(
      "agent",
      "name email phone avatar agency"
    );
    if (!property) {
      res.status(404);
      throw new Error("Property not found");
    }
    res.json(mapProperty(property));
  } catch (error) {
    next(error);
  }
};

const getCities = async (req, res, next) => {
  try {
    const cities = await Property.distinct("location.city", { isApproved: true });
    res.json(cities.sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getFeaturedProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  toggleFavorite,
  getFavorites,
  approveProperty,
  getCities,
};
