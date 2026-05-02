const express = require("express");
const { getAdminStats } = require("../controllers/admin.controller");
const { protect, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/stats", protect, requireRole("admin"), getAdminStats);

module.exports = router;
