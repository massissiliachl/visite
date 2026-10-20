const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

// Public — site
router.get("/", activityController.getPublishedActivities);
router.get("/:slug", activityController.getActivityBySlug);

module.exports = router;
