const express = require("express");
const { protect, requireRole } = require("../middleware/auth.middleware");
const { runActor, importRun, apifyWebhook } = require("../controllers/apify.controller");

const router = express.Router();

router.post("/runs", protect, requireRole("admin"), runActor);
router.post("/runs/:runId/import", protect, requireRole("admin"), importRun);

router.post("/webhook", apifyWebhook);

module.exports = router;

