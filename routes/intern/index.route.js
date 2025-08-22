import express from "express";
import internTrainingRoutes from "./intern.training.route.js";
import internProfileRoutes from "./intern.profile.route.js";

const router = express.Router({ mergeParams: true });

router.use("/training", internTrainingRoutes);

router.use("/", internProfileRoutes);

export default router;
