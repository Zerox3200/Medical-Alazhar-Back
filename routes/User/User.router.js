import express from "express";
import {
    createNormalUser, deleteUser, getAllUsers,
    getUserProfile, updateUserProfile, userSubscripeToCourse
} from "../../controllers/User/User.controller.js";
import validate from "../../validation/validate.js";
import { createNormalUserValidation } from "../../validation/User/User.validation.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import { handleUploadError, handleUploadSuccess, uploadToFolderFlexible } from "../../services/cloudnairyUpload.js";
import userProgressRoutes from "./userProgress.route.js";


const router = express.Router({ mergeParams: true });

// Create Normal User
router.post("/Create-Account", validate(createNormalUserValidation, true), createNormalUser);

// Update User Profile
router.patch("/Update-Profile", isAuthenticated, uploadToFolderFlexible("profile-images"),
    handleUploadError, handleUploadSuccess, updateUserProfile);

// Get profile
router.get("/Get-Profile", isAuthenticated, getUserProfile);

//***********************************************Subscriptions ***********************************************/

// Subscribe to course
router.post("/Subscribe-To-Course/:courseId", isAuthenticated, userSubscripeToCourse);



// delete user
router.delete("/delete-Account/:id", deleteUser);

// get all users
router.get("/get-all-users", getAllUsers);

// User progress routes
router.use("/progress", userProgressRoutes);

export default router;