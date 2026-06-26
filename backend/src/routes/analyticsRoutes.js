import express from "express";
import { getTopRecommended } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/top-recommended", getTopRecommended);

export default router;
