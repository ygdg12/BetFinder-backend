const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 1 },
    priceType: { type: String, enum: ["sale", "rent"], required: true },
    type: {
      type: String,
      enum: ["house", "apartment", "land", "office", "villa", "studio"],
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "sold", "rented", "pending"],
      default: "available",
    },
    location: {
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      area: { type: String, required: true, trim: true },
      country: { type: String, default: "Italy" },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
    },
    features: {
      bedrooms: { type: Number, required: true, min: 0 },
      bathrooms: { type: Number, required: true, min: 0 },
      size: { type: Number, required: true, min: 1 },
      floors: { type: Number, default: 0 },
      garage: { type: Boolean, default: false },
      pool: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      elevator: { type: Boolean, default: false },
      furnished: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      airConditioning: { type: Boolean, default: false },
    },
    contactPhone: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    images: [{ type: String }],
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isApproved: { type: Boolean, default: false },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    source: {
      provider: { type: String, trim: true },
      externalId: { type: String, trim: true },
      url: { type: String, trim: true },
      runId: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

propertySchema.index({ title: "text", description: "text", "location.city": "text", "location.area": "text" });
propertySchema.index(
  { "source.provider": 1, "source.externalId": 1 },
  { unique: true, sparse: true, name: "property_source_provider_externalId_unique" }
);

module.exports = mongoose.model("Property", propertySchema);
