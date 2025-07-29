import express from "express";

import roundsRouter from "./admin.rounds.routes.js";

// Admin Routes
import { adminSignup } from "../../controllers/auth/admin/signup.controller.js";
import { adminSignupValidation } from "../../validation/admin/admin.validation.js";
import isAdmin from "../../middlewares/isAdmin.js";
import {
  adminData,
  approveUserAccount,
  getNotApprovedUsers,
  modifyAccountLock,
  uploadAdminProfileImage,
} from "../../controllers/admin/admin.controller.js";
import multerConfig from "../../services/multerConfig.js";

// Supervisors Routes
import {
  getAllSupervisors,
  changeSupervisorRole,
  getSingleSupervisor,
} from "../../controllers/admin/admin.supervisors.controller.js";

// Interns Routes
import {
  getAllCases,
  getAllInterns,
  getSingleIntern,
} from "../../controllers/admin/admin.interns.controller.js";

import courseValidation from "../../validation/course/course.validation.js";

import { check } from "express-validator";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import checkRole from "../../middlewares/checkRole.js";
import validate from "../../validation/validate.js";
import {
  addQuizzesToCourse,
  addVideosToCourse,
  createCourse,
  // getAllCourses,
  getCourseData,
  getQuiz,
} from "../../controllers/admin/admin.courses.controller.js";
import { videoValidation } from "../../validation/course/video.validation.js";
import { quizValidation } from "../../validation/course/quiz.validation.js";
import coursesRouter from "./admin.courses.route.js";

const router = express.Router({ mergeParams: true });

// POST signup
router.post("/auth/signup", validate(adminSignupValidation), adminSignup);

// GET not approved users
router.get(
  "/accounts/approvals",
  isAuthenticated,
  isAdmin,
  getNotApprovedUsers
);

// PATCH approve user account
router.patch(
  "/accounts/:userId/approvals",
  isAuthenticated,
  isAdmin,
  approveUserAccount
);

// PATCH account lock
router.patch(
  "/accounts/:userId/locked",
  isAuthenticated,
  isAdmin,
  modifyAccountLock
);

// GET admin data
router.get("/:adminId/profile", isAuthenticated, isAdmin, adminData);

// Upload admin profile image
router.post(
  "/:adminId/upload/profile",
  isAuthenticated,
  isAdmin,
  multerConfig.single("profile-image"),
  uploadAdminProfileImage
);

/********************************INTERNS********************************/

// GET all interns
router.get("/interns", isAuthenticated, isAdmin, getAllInterns);

// GET single intern
router.get("/intern/:internId", isAuthenticated, isAdmin, getSingleIntern);

/********************************SUPERVISORS********************************/

// Get All Supervisors
router.get("/supervisors", isAuthenticated, isAdmin, getAllSupervisors);

// Get Single Supervisor
router.get(
  "/supervisors/:supervisorId",
  isAuthenticated,
  isAdmin,
  getSingleSupervisor
);

// Change Role of supervisors
router.patch(
  "/supervisors/:supervisorId/role",
  isAuthenticated,
  isAdmin,
  validate([
    check("role")
      .notEmpty()
      .withMessage("Invalid role")
      .isIn(["coordinator", "supervisor"])
      .withMessage("Select a role form the list"),
  ]),
  changeSupervisorRole
);

/********************************CASES********************************/
// router.get("/interns/training/cases", isAuthenticated, isAdmin, getAllCases);
/********************************COURSES********************************/
router.use("/courses", coursesRouter);
router.use("/rounds", roundsRouter);

export default router;
