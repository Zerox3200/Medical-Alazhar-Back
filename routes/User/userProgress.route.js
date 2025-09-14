import express from "express";
import {
    getUserCourseProgress,
    submitVideoCompletion,
    submitQuiz,
    submitFinalAssessment,
    getUserCertificate,
    resetQuizAttempts,
} from "../../controllers/User/userProgress.controller.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";

const router = express.Router();

// Get user progress for a specific course
router.get("/:courseId/progress", isAuthenticated, getUserCourseProgress);

// Submit video completion
router.post("/:courseId/videos/:videoId/complete", isAuthenticated, submitVideoCompletion);

// Submit quiz
router.post("/:courseId/quizzes/:quizId/submit", isAuthenticated, submitQuiz);

// Submit final assessment
router.post("/:courseId/final-assessment/submit", isAuthenticated, submitFinalAssessment);

// Get user's certificate
router.get("/:courseId/certificate", isAuthenticated, getUserCertificate);

// Reset quiz attempts (admin function)
router.post("/:courseId/quizzes/:quizId/reset", isAuthenticated, resetQuizAttempts);

export default router;
