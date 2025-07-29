import express from "express";
import {
  mbbchCertificateImage,
  nationalIDImage,
  profileImage,
} from "../../controllers/uploads/uploader.controller.js";
import multerConfig from "../services/multerConfig.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import checkRole from "../middlewares/checkRole.js";

const router = express.Router({ mergeParams: true });

// Upload Profile Image
router.post(
  "/:userId/uploads/profile-image",
  isAuthenticated,
  checkRole(["intern"]),
  multerConfig.single("profile-image"),
  profileImage
);

export default router;
