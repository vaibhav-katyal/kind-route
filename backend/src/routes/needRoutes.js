import express from "express";
import {
  getNeeds,
  createNeed,
  deleteNeed,
} from "../controllers/needController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getNeeds);
router.post("/", optionalAuth, createNeed);
router.delete("/:id", optionalAuth, deleteNeed);

export default router;
