import express from "express";
import {
  getAllCoursesForUser,
  getCourseForUser,
  getQuiz,
  getVideo,
  submitQuiz,
  submitVideo,
} from "../../controllers/course/index.controller.js";
import checkQuizAccess from "../../middlewares/checkQuizAccess.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";


const courseRoutes = express.Router({ mergeParams: true });

// GET all courses
courseRoutes.get("/courses", getAllCoursesForUser);

// GET single course
courseRoutes.get("/:courseId", getCourseForUser);

// GET quiz - NOTE: quizId is a query parameter
courseRoutes.get(
  "/:courseId/quizzes",
  isAuthenticated,
  checkQuizAccess,
  getQuiz
);

// GET quiz - NOTE: quizId is a query parameter
courseRoutes.get("/:courseId/videos", isAuthenticated, getVideo);

// PATCH submit video
courseRoutes.patch("/:courseId/videos/submit", isAuthenticated, submitVideo);

// PATCH submit quiz
courseRoutes.patch(
  "/:courseId/quizzes/submit",
  isAuthenticated,
  checkQuizAccess,
  submitQuiz
);

export default courseRoutes;
