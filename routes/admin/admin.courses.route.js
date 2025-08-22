import express from "express";
import isAdmin from "../../middlewares/isAdmin.js";
import courseValidation from "../../validation/course/course.validation.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import validate from "../../validation/validate.js";
import {
  addQuizQuestion,
  addQuizzesToCourse,
  addVideosToCourse,
  createCourse,
  getAllCourses,
  getCourseData,
  getQuiz,
  getVideo,
} from "../../controllers/admin/admin.courses.controller.js";
import { videoValidation } from "../../validation/course/video.validation.js";
import { quizValidation } from "../../validation/course/quiz.validation.js";
import multerConfig from "../../services/multerConfig.js";

const coursesRouter = express.Router({ mergeParams: true });

/****************************GET***************************/

// GET all courses
coursesRouter.get("/", isAuthenticated, isAdmin, getAllCourses);

// GET course data
coursesRouter.get("/:courseId", isAuthenticated, isAdmin, getCourseData);

// GET quiz NOTE: quizId is a query parameter
coursesRouter.get("/:courseId/quizzes", isAuthenticated, isAdmin, getQuiz);

// GET video NOTE: videoId is a query parameter
coursesRouter.get("/:courseId/videos", isAuthenticated, isAdmin, getVideo);

/****************************POST***************************/
// Create new course
coursesRouter.post(
  "/create",
  isAuthenticated,
  isAdmin,
  validate(courseValidation),
  multerConfig.single("course-banner"),
  createCourse
);

// Add videos to course
coursesRouter.post(
  "/:courseId/videos/add",
  isAuthenticated,
  isAdmin,
  validate(videoValidation),
  addVideosToCourse
);

// Add quizzes to course
coursesRouter.post(
  "/:courseId/quizzes/add",
  isAuthenticated,
  isAdmin,
  validate(quizValidation),
  addQuizzesToCourse
);

/****************************PATCH***************************/

// Add question
coursesRouter.patch(
  "/quizzes/:quizId/add-questions",
  isAuthenticated,
  isAdmin,
  validate(quizValidation),
  addQuizQuestion
);

export default coursesRouter;
