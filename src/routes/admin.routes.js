const express = require("express");
const {
  getAdminStats,
  getAdminProperties,
  approveAdminProperty,
  rejectAdminProperty,
} = require("../controllers/admin.controller");
const { protect, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/stats", protect, requireRole("admin"), getAdminStats);
router.get("/properties", protect, requireRole("admin"), getAdminProperties);
router.patch("/properties/:id/approve", protect, requireRole("admin"), approveAdminProperty);
router.patch("/properties/:id/reject", protect, requireRole("admin"), rejectAdminProperty);

module.exports = router;
