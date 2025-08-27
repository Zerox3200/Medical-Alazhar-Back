import express from "express";
import isAdmin from "../../middlewares/isAdmin.js";
import courseValidation from "../../validation/course/course.validation.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import validate from "../../validation/validate.js";
import {
  addQuizzesToCourse,
  addVideosToCourse,
  createCourse,
  deleteCourse,
  deleteQuiz,
  deleteVideoFromCourse,
  getAllCourses,
  getAvailableVideos,
  getCourseData,
  getQuiz,
  getQuizById,
  getVideo,
  updateCourse,
  updateCourseStatus,
  updateQuiz,
  updateVideo,
} from "../../controllers/admin/admin.courses.controller.js";
import { videoValidation } from "../../validation/course/video.validation.js";
import { quizValidation } from "../../validation/course/quiz.validation.js";
import multerConfig from "../../services/multerConfig.js";
import { handleUploadError, handleUploadSuccess, uploadToFolderFlexible, uploadVideoToFolderFlexible } from "../../services/cloudnairyUpload.js";
import checkAdminAndCleanup from "../../middlewares/checkAdminAndCleanup.js";
import checkAdminAndCleanupVideo from "../../middlewares/checkAdminAndCleanupVideo.js";

const coursesForAdminRoutes = express.Router({ mergeParams: true });

/****************************GET***************************/

// GET all courses
coursesForAdminRoutes.get("/", isAuthenticated, isAdmin, getAllCourses);

// GET course data
coursesForAdminRoutes.get("/:courseId", isAuthenticated, isAdmin, getCourseData);

// GET quiz NOTE: quizId is a query parameter
coursesForAdminRoutes.get("/:courseId/quizzes", isAuthenticated, isAdmin, getQuiz);

// GET video NOTE: videoId is a query parameter
coursesForAdminRoutes.get("/:courseId/videos", isAuthenticated, isAdmin, getVideo);

/****************************POST***************************/
// Create new course
coursesForAdminRoutes.post(
  "/create",
  uploadToFolderFlexible("courseImage"),
  handleUploadError,
  handleUploadSuccess,
  isAuthenticated,
  checkAdminAndCleanup,
  createCourse
);

// Delete course
coursesForAdminRoutes.delete("/:courseId", isAuthenticated, isAdmin, deleteCourse);

// update course 
coursesForAdminRoutes.patch("/:courseId",
  uploadToFolderFlexible("courseImage"),
  handleUploadError,
  handleUploadSuccess,
  isAuthenticated,
  checkAdminAndCleanup,
  updateCourse
);

// update course status
coursesForAdminRoutes.patch("/:courseId/status", isAuthenticated, isAdmin, updateCourseStatus);

// Add videos to course
coursesForAdminRoutes.post(
  "/:courseId/videos/add",
  uploadVideoToFolderFlexible("courseVideos"),
  handleUploadError,
  handleUploadSuccess,
  isAuthenticated,
  checkAdminAndCleanupVideo,
  addVideosToCourse
);

// Delete video
coursesForAdminRoutes.delete("/delete-video/:videoId", isAuthenticated, isAdmin, deleteVideoFromCourse);

// Update video
coursesForAdminRoutes.patch("/update-video/:videoId",
  uploadVideoToFolderFlexible("courseVideos"),
  handleUploadError,
  handleUploadSuccess,
  isAuthenticated,
  checkAdminAndCleanupVideo,
  updateVideo
);

// Call aviliable videos
coursesForAdminRoutes.get("/videos/available/:courseId", isAuthenticated, isAdmin, getAvailableVideos);

// Add quizzes to course
coursesForAdminRoutes.post(
  "/quizzes/add",
  isAuthenticated,
  isAdmin,
  validate(quizValidation, true),
  addQuizzesToCourse
);

// Delete quiz
coursesForAdminRoutes.delete("/videos/:videoId/quizzes/:quizId", isAuthenticated, isAdmin, deleteQuiz);

// Get quiz by id ( for admin only )
coursesForAdminRoutes.get("/quizzes/:quizId", isAuthenticated, isAdmin, getQuizById);

// Update quiz
coursesForAdminRoutes.patch(
  "/quizzes/:quizId/update",
  isAuthenticated,
  isAdmin,
  validate(quizValidation, true),
  updateQuiz
);



export default coursesForAdminRoutes;
