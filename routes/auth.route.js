import express from "express";
import {
  login,
  logout,
  changePassword,
  getUserData,
} from "../controllers/auth/auth.controller.js";
import {
  changePasswordValidation,
  loginValidation,
} from "../validation/login.validation.js";
import validate from "../validation/validate.js";
import { validateRefreshToken } from "../validation/validateRefreshToken.js";
import refreshToken from "../controllers/auth/refreshToken.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import isAuthorized from "../middlewares/isAuthorized.js";

const router = express.Router({ mergeParams: true });

router.post("/login", validate(loginValidation), login);

router.post("/logout", logout);

router.post("/refresh", validateRefreshToken, refreshToken);

router.get("/me", isAuthenticated, getUserData);

router.patch(
  "/:userId/password/change",
  isAuthenticated,
  isAuthorized,
  validate(changePasswordValidation),
  changePassword
);

export default router;
