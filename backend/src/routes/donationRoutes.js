import express from "express";
import {
  getAllDonations,
  getDonationById,
  createDonation,
  requestDonation,
  approveDonationRequest,
  startDelivery,
  acknowledgeReceipt,
  reserveDonation,
  releaseDonation,
  completeDonation,
  deleteDonation,
} from "../controllers/donationController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllDonations);
router.get("/:id", getDonationById);
router.post("/", optionalAuth, createDonation);

// NGO Request and Donor Approval flow
router.post("/:id/request", optionalAuth, requestDonation);
router.post("/:id/approve", optionalAuth, approveDonationRequest);
router.post("/:id/start-delivery", optionalAuth, startDelivery);
router.post("/:id/acknowledge", optionalAuth, acknowledgeReceipt);

// Backward-compatible routes
router.post("/:id/reserve", optionalAuth, reserveDonation);
router.post("/:id/release", optionalAuth, releaseDonation);
router.post("/:id/complete", optionalAuth, completeDonation);
router.delete("/:id", optionalAuth, deleteDonation);

export default router;
