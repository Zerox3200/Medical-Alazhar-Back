import express from "express";
import {
  getAllCourses,
  getCourse,
  getQuiz,
  getVideo,
  submitQuiz,
  submitVideo,
} from "../../controllers/intern/intern.course.controller.js";
import checkQuizAccess from "../../middlewares/checkQuizAccess.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import checkRole from "../../middlewares/checkRole.js";

const internCourseRoutes = express.Router({ mergeParams: true });

// GET all courses
internCourseRoutes.get("/", isAuthenticated, getAllCourses);

// GET single course
internCourseRoutes.get("/:courseId", isAuthenticated, getCourse);

// GET quiz - NOTE: quizId is a query parameter
internCourseRoutes.get(
  "/:courseId/quizzes",
  isAuthenticated,
  checkRole(["intern"]),
  checkQuizAccess,
  getQuiz
);

// GET quiz - NOTE: quizId is a query parameter
internCourseRoutes.get(
  "/:courseId/videos",
  isAuthenticated,
  checkRole(["intern"]),
  getVideo
);

// PATCH submit video
internCourseRoutes.patch(
  "/:courseId/videos/submit",
  isAuthenticated,
  checkRole(["intern"]),
  submitVideo
);

// PATCH submit quiz
internCourseRoutes.patch(
  "/:courseId/quizzes/submit",
  isAuthenticated,
  checkRole(["intern"]),
  checkQuizAccess,
  submitQuiz
);

export default internCourseRoutes;
