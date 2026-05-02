const express = require("express");
const {
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
} = require("../controllers/property.controller");
const { protect, requireRole } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const validate = require("../middleware/validate.middleware");
const { propertyWriteRules, propertyQueryRules } = require("../validators/property.validators");

const router = express.Router();

router.get("/", propertyQueryRules, validate, getProperties);
router.get("/featured", getFeaturedProperties);
router.get("/cities", getCities);
router.get("/my", protect, requireRole("agent", "admin"), getMyProperties);
router.get("/favorites", protect, getFavorites);
router.get("/:id", getPropertyById);
router.post("/:id/favorite", protect, toggleFavorite);
router.post("/", protect, requireRole("agent", "admin"), upload.array("images", 10), propertyWriteRules, validate, createProperty);
router.put(
  "/:id",
  protect,
  requireRole("agent", "admin"),
  upload.array("images", 10),
  propertyWriteRules,
  validate,
  updateProperty
);
router.delete("/:id", protect, requireRole("agent", "admin"), deleteProperty);
router.patch("/:id/approve", protect, requireRole("admin"), approveProperty);

module.exports = router;
