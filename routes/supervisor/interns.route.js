import express from "express";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import checkRole from "../../middlewares/checkRole.js";
import {
  getMyInterns,
  getMyIntern,
  addAssessment,
  reviewAssessment,
} from "../../controllers/supervisor/interns.controller.js";
import { acceptTrainingDomains } from "../../controllers/supervisor/interns.controller.js";

const internsRouter = express.Router({ mergeParams: true });

// Get all interns
internsRouter.get(
  "/",
  isAuthenticated,
  checkRole(["supervisor"]),
  getMyInterns
);

// Get single intern
internsRouter.get(
  "/:internId",
  isAuthenticated,
  checkRole(["supervisor"]),
  getMyIntern
);

/* Handle supervisor training domains acceptance */
internsRouter.patch(
  "/:internId/training-domains/review",
  isAuthenticated,
  checkRole(["supervisor"]),
  acceptTrainingDomains
);

// pass/fail assessment
internsRouter.patch(
  "/:internId/assessments/:assessmentId/review",
  isAuthenticated,
  checkRole(["supervisor"]),
  reviewAssessment
);

export default internsRouter;
