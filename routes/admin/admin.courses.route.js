import express from "express";
import isAdmin from "../../middlewares/isAdmin.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import validate from "../../validation/validate.js";
import {
  addQuizzesToCourse,
  addVideosToCourse,
  createCourse,
  deleteCourse,
  deleteQuiz,
  deleteVideoFromCourse,
  getAllCoursesForAdmin,
  getAvailableVideos,
  getCourseData,
  getQuiz,
  getQuizById,
  getVideo,
  updateCourse,
  updateCoursePaidStatus,
  updateCourseStatus,
  updateQuiz,
  updateVideo,
} from "../../controllers/admin/admin.courses.controller.js";

import {
  createSection,
  getCourseSections,
  getSection,
  updateSection,
  deleteSection,
  updateSectionStatus,
} from "../../controllers/admin/admin.sections.controller.js";

import {
  createChapter,
  getSectionChapters,
  getChapter,
  updateChapter,
  deleteChapter,
  updateChapterStatus,
} from "../../controllers/admin/admin.chapters.controller.js";

import { quizValidation } from "../../validation/course/quiz.validation.js";
import { sectionValidation } from "../../validation/course/section.validation.js";
import { chapterValidation } from "../../validation/course/chapter.validation.js";
import { handleUploadError, handleUploadSuccess, uploadToCloudinary, uploadToFolderFlexible, uploadVideoToFolderFlexible } from "../../services/cloudnairyUpload.js";
import checkAdminAndCleanup from "../../middlewares/checkAdminAndCleanup.js";
import checkAdminAndCleanupVideo from "../../middlewares/checkAdminAndCleanupVideo.js";

const coursesForAdminRoutes = express.Router({ mergeParams: true });

/****************************GET***************************/

// GET all courses
coursesForAdminRoutes.get("/", isAuthenticated, isAdmin, getAllCoursesForAdmin);

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

// update course paid status
coursesForAdminRoutes.patch("/:courseId/paid", isAuthenticated, isAdmin, updateCoursePaidStatus);

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
coursesForAdminRoutes.delete("/delete-video/:videoId/chapter/:chapterId", isAuthenticated, isAdmin, deleteVideoFromCourse);

// Update video
coursesForAdminRoutes.patch("/update-video/:videoId/chapter/:chapterId",
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
coursesForAdminRoutes.delete("/videos/quizzes/:quizId", isAuthenticated, isAdmin, deleteQuiz);

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

/****************************SECTIONS ROUTES***************************/

// GET all sections for a course
coursesForAdminRoutes.get("/:courseId/sections", isAuthenticated, isAdmin, getCourseSections);

// GET single section
coursesForAdminRoutes.get("/:courseId/sections/:sectionId", isAuthenticated, isAdmin, getSection);

// Create new section
coursesForAdminRoutes.post(
  "/:courseId/sections",
  isAuthenticated,
  isAdmin,
  createSection
);

// Update section
coursesForAdminRoutes.patch(
  "/:courseId/sections/:sectionId",
  isAuthenticated,
  isAdmin,
  updateSection
);

// Update section status
coursesForAdminRoutes.patch(
  "/:courseId/sections/:sectionId/status",
  isAuthenticated,
  isAdmin,
  updateSectionStatus
);

// Delete section
coursesForAdminRoutes.delete("/:courseId/sections/:sectionId", isAuthenticated, isAdmin, deleteSection);

/****************************CHAPTERS ROUTES***************************/

// GET all chapters for a section
coursesForAdminRoutes.get("/:courseId/sections/:sectionId/chapters", isAuthenticated, isAdmin, getSectionChapters);

// GET single chapter
coursesForAdminRoutes.get("/:courseId/sections/:sectionId/chapters/:chapterId", isAuthenticated, isAdmin, getChapter);

// Create new chapter
coursesForAdminRoutes.post(
  "/:courseId/sections/:sectionId/chapters",
  isAuthenticated,
  isAdmin,
  // validate(chapterValidation.createChapterValidation, true),
  createChapter
);

// Update chapter
coursesForAdminRoutes.patch(
  "/:courseId/sections/:sectionId/chapters/:chapterId",
  isAuthenticated,
  isAdmin,
  validate(chapterValidation.updateChapterValidation, true),
  updateChapter
);

// Update chapter status
coursesForAdminRoutes.patch(
  "/:courseId/sections/:sectionId/chapters/:chapterId/status",
  isAuthenticated,
  isAdmin,
  updateChapterStatus
);

// Delete chapter
coursesForAdminRoutes.delete("/:courseId/sections/:sectionId/chapters/:chapterId", isAuthenticated, isAdmin, deleteChapter);

export default coursesForAdminRoutes;
