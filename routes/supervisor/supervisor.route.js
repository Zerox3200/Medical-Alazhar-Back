import express from "express";
import internsRouter from "./interns.route.js";
import { assignInternToSupervisor } from "../../controllers/supervisor/supervisor.controller.js";
import { profileImage } from "../../controllers/supervisor/supervisor.controller.js";
import multerConfig from "../../services/multerConfig.js";
import { getSupervisor } from "../../controllers/supervisor/supervisor.controller.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import checkRole from "../../middlewares/checkRole.js";
import isAuthorizedSupervisor from "../../middlewares/isAuthorizedSupervisor.js";
import validate from "../../validation/validate.js";
import { supervisorSignupValidation } from "../../validation/supervisor/supervisor.validation.js";
import { supervisorSignup } from "../../controllers/auth/supervisor/signup.controller.js";
import {
  addAssessment,
  getAssessments,
  getRoundWaves,
} from "../../controllers/supervisor/interns.controller.js";

const router = express.Router({ mergeParams: true });

/* Interns Routes */
router.use("/:supervisorId/interns", internsRouter);

// POST signup
router.post(
  "/auth/signup",
  validate(supervisorSignupValidation),
  supervisorSignup
);

// Get round waves
router.get(
  "/:supervisorId/waves",
  isAuthenticated,
  checkRole(["supervisor"]),
  getRoundWaves
);

// Get Supervisor
router.get(
  "/:supervisorId",
  isAuthenticated,
  checkRole(["admin", "supervisor", "coordinator"]),
  getSupervisor
);

/* Assign intern to supervisor */
router.patch(
  "/:roundId/:coordinatorId/assign-intern",
  isAuthenticated,
  checkRole(["coordinator"]),
  assignInternToSupervisor
);

// Get assessments
router.get(
  "/:supervisorId/rounds/:roundId/assessments",
  isAuthenticated,
  checkRole(["supervisor"]),
  getAssessments
);

// Add assessment
router.patch(
  "/:supervisorId/rounds/:roundId/assessments/add",
  isAuthenticated,
  checkRole(["supervisor"]),
  addAssessment
);

// Upload Profile Image
router.post(
  "/:supervisorId/uploads/profile-image",
  isAuthenticated,
  checkRole(["supervisor", "coordinator", "admin"]),
  multerConfig.single("profile-image"),
  profileImage
);

export default router;
