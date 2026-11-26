import express from "express";
import {
  getAllDonations,
  getDonationById,
  createDonation,
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
router.post("/:id/reserve", optionalAuth, reserveDonation);
router.post("/:id/release", optionalAuth, releaseDonation);
router.post("/:id/complete", optionalAuth, completeDonation);
router.delete("/:id", optionalAuth, deleteDonation);

export default router;
