import express from "express";
import { createNormalUser, getUserProfile } from "../../controllers/User/User.controller.js";
import validate from "../../validation/validate.js";
import { createNormalUserValidation } from "../../validation/User/User.validation.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";


const router = express.Router({ mergeParams: true });

// Create Normal User
router.post("/Create-Account", validate(createNormalUserValidation), createNormalUser);

// Get profile
router.get("/Get-Profile", isAuthenticated, getUserProfile);

export default router;