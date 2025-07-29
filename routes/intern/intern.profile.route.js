import express from "express";
import {
  mbbchCertificateImage,
  nationalIDImage,
} from "../../controllers/uploads/uploader.controller.js";
import multerConfig from "../../services/multerConfig.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import isAuthorized from "../../middlewares/isAuthorized.js";
import checkRole from "../../middlewares/checkRole.js";
import {
  getIntern,
  profileImage,
} from "../../controllers/intern/intern.controller.js";
import validate from "../../validation/validate.js";
import { internSignup } from "../../controllers/auth/intern/signup.controller.js";
import { internSignupValidation } from "../../validation/intern/intern.validation.js";

const internProfileRoutes = express.Router({ mergeParams: true });

// signup
internProfileRoutes.post(
  "/auth/signup",
  validate(internSignupValidation),
  internSignup
);

// Get intern
internProfileRoutes.get(
  "/:internId",
  isAuthenticated,
  checkRole("intern"),
  // isAuthorized,
  getIntern
);

// Upload Profile Image
internProfileRoutes.post(
  "/:internId/uploads/profile-image",
  isAuthenticated,
  checkRole(["intern"]),
  multerConfig.single("profile-image"),
  profileImage
);

// Upload ID Image
internProfileRoutes.post(
  "/:internId/uploads/nationalID-image",
  isAuthenticated,
  checkRole(["intern"]),
  isAuthorized,
  multerConfig.single("nationalID-image"),
  nationalIDImage
);

// Upload Certificate Image
internProfileRoutes.post(
  "/:internId/uploads/mbbch-certificate-image",
  isAuthenticated,
  checkRole(["intern"]),
  isAuthorized,
  multerConfig.single("mbbch-certificate-image"),
  mbbchCertificateImage
);

export default internProfileRoutes;
