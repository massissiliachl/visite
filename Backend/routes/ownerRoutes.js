const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ownerController = require("../controllers/ownerController");

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Accès administrateur requis" });
  }
  next();
};

const ownerOrAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role !== "proprietaire" && role !== "admin") {
    return res.status(403).json({ error: "Accès propriétaire requis" });
  }
  next();
};

// Admin
router.get("/proprietaires", auth, adminOnly, ownerController.getProprietaires);
router.post("/proprietaires", auth, adminOnly, ownerController.createProprietaire);
router.get(
  "/proprietaires/:id/reservations",
  auth,
  adminOnly,
  ownerController.getOwnerReservations
);
router.put(
  "/proprietaires/:id/properties",
  auth,
  adminOnly,
  ownerController.assignProperties
);
router.post(
  "/sync-site-properties",
  auth,
  adminOnly,
  ownerController.syncSiteProperties
);
router.get(
  "/submitted-properties",
  auth,
  adminOnly,
  ownerController.listSubmittedProperties
);
router.patch(
  "/properties/:id/approve",
  auth,
  adminOnly,
  ownerController.approveProperty
);
router.patch(
  "/properties/:id/reject",
  auth,
  adminOnly,
  ownerController.rejectProperty
);
router.delete(
  "/properties/:id",
  auth,
  adminOnly,
  ownerController.deletePropertyAsAdmin
);

// Espace propriétaire
router.get("/me/properties", auth, ownerOrAdmin, ownerController.getMyProperties);
router.post("/me/properties", auth, ownerOrAdmin, ownerController.createMyProperty);
router.get(
  "/me/properties/:propertyId/blocked",
  auth,
  ownerOrAdmin,
  ownerController.getMyPropertyBlocked
);
router.post(
  "/me/properties/:propertyId/block",
  auth,
  ownerOrAdmin,
  ownerController.blockMyPropertyDates
);
router.delete(
  "/me/properties/:propertyId/block/:date",
  auth,
  ownerOrAdmin,
  ownerController.unblockMyPropertyDate
);
router.get("/me/reservations", auth, ownerOrAdmin, ownerController.getMyReservations);

module.exports = router;
