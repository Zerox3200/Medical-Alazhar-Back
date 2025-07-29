import express from "express";
import internTrainingRoutes from "./intern.training.route.js";
import internProfileRoutes from "./intern.profile.route.js";
import internCourseRoutes from "./intern.course.route.js";

const router = express.Router({ mergeParams: true });

router.use("/courses", internCourseRoutes);

router.use("/training", internTrainingRoutes);

router.use("/", internProfileRoutes);

export default router;
