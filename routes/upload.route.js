import express from "express";
import {
  mbbchCertificateImage,
  nationalIDImage,
  profileImage,
} from "../../controllers/uploads/uploader.controller.js";
import { uploadToFolder, handleUploadSuccess, handleUploadError, extractPublicIdFromUrl, deleteImage, uploadVideoToFolderFlexible, uploadLargeVideoToFolder, handleLargeVideoUploadSuccess } from "../services/cloudnairyUpload.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import checkRoleAndCleanup from "../middlewares/checkRoleAndCleanup.js";
import checkAdminAndCleanupVideo from "../middlewares/checkAdminAndCleanupVideo.js";

const router = express.Router({ mergeParams: true });

// Test URL extraction
router.post("/test-url-extraction", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "URL is required"
    });
  }

  const publicId = extractPublicIdFromUrl(url);

  res.json({
    success: true,
    originalUrl: url,
    extractedPublicId: publicId,
    message: publicId ? "Public ID extracted successfully" : "Failed to extract public ID"
  });
});

// Test image deletion
router.post("/test-delete-image", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "URL is required"
    });
  }

  const result = await deleteImage(url);

  res.json({
    success: result.success,
    message: result.success ? "Image deleted successfully" : "Failed to delete image",
    data: result
  });
});

// Test video upload
router.post("/test-video-upload",
  uploadVideoToFolderFlexible("testVideos"),
  handleUploadError,
  handleUploadSuccess,
  (req, res) => {
    res.json({
      success: true,
      message: "Video uploaded successfully to Cloudinary",
      data: req.uploadedFile
    });
  }
);

// Test video upload with admin cleanup
router.post("/test-video-upload-admin",
  uploadVideoToFolderFlexible("testVideos"),
  handleUploadError,
  handleUploadSuccess,
  isAuthenticated,
  checkAdminAndCleanupVideo,
  (req, res) => {
    res.json({
      success: true,
      message: "Video uploaded successfully to Cloudinary (Admin verified)",
      data: req.uploadedFile
    });
  }
);

// Test large video upload (alternative method for very large files)
router.post("/test-large-video-upload",
  uploadLargeVideoToFolder("testVideos"),
  handleUploadError,
  handleLargeVideoUploadSuccess,
  (req, res) => {
    res.json({
      success: true,
      message: "Large video uploaded successfully to Cloudinary using upload_large",
      data: req.uploadedFile
    });
  }
);

// Upload Profile Image
router.post(
  "/:userId/uploads/profile-image",
  isAuthenticated,
  uploadToFolder("profile-images"),
  handleUploadError,
  handleUploadSuccess,
  checkRoleAndCleanup(["intern"]),
  profileImage
);

// Test upload route (for demonstration)
router.post(
  "/test-upload",
  uploadToFolder("test"),
  handleUploadError,
  handleUploadSuccess,
  (req, res) => {
    res.json({
      success: true,
      message: "Image uploaded successfully to Cloudinary",
      data: req.uploadedFile
    });
  }
);

// Debug route to check field names
router.post(
  "/debug-upload",
  (req, res) => {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("Request file:", req.file);
    console.log("Request headers:", req.headers);

    res.json({
      success: true,
      message: "Debug information logged",
      body: req.body,
      files: req.files,
      file: req.file,
      contentType: req.headers['content-type']
    });
  }
);

// Admin-only upload route with cleanup
router.post(
  "/admin-upload",
  isAuthenticated,
  uploadToFolder("admin-uploads"),
  handleUploadError,
  handleUploadSuccess,
  checkRoleAndCleanup(["admin"]),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin upload successful",
      data: req.uploadedFile
    });
  }
);

// Multi-role upload route with cleanup
router.post(
  "/multi-role-upload",
  isAuthenticated,
  uploadToFolder("multi-role"),
  handleUploadError,
  handleUploadSuccess,
  checkRoleAndCleanup(["admin", "supervisor"]),
  (req, res) => {
    res.json({
      success: true,
      message: "Multi-role upload successful",
      data: req.uploadedFile
    });
  }
);

export default router;
