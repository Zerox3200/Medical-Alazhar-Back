import Quiz from "../models/course/quiz.models.js";
import Video from "../models/course/video.models.js";
import Intern from "../models/intern/Intern.models.js";
import asyncWrapper from "./asyncWrapper.js";

// Check quiz access (middleware to lock/unlock quiz)
const checkQuizAccess = asyncWrapper(async (req, res, next) => {
  const { quizId } = req.query;
  const { _id: internId } = req.user;

  const quiz = await Quiz.findById(quizId).sort({ createdAt: 1 }).lean();

  if (!quiz) return res.status(404).json({ error: "Quiz not found" });

  const courseQuizzes = await Quiz.find({ courseId: quiz.courseId });

  const internVideos = await Intern.findOne(
    {
      _id: internId,
      "coursesProgress.courseId": quiz.courseId,
    },
    { "coursesProgress.videos": 1 }
  ).lean();

  const currentInternVideos = internVideos?.coursesProgress?.[0]?.videos?.map(
    (videos) => videos
  );

  const correspondingQuizVideo = currentInternVideos.filter(
    (video) => video.videoId.toString() === quiz.videoId.toString()
  );

  if (!correspondingQuizVideo?.[0]?.isCompleted) {
    return res
      .status(422)
      .json({ message: "You must finish the corresponding video first" });
  }

  const currentQuizIndex = courseQuizzes.findIndex((q) => q._id.equals(quizId));
  if (currentQuizIndex === -1) {
    return res.status(400).json({ error: "Invalid quiz" });
  }

  if (currentQuizIndex === 0) {
    return next();
  }

  const previousQuizId = courseQuizzes[currentQuizIndex - 1]._id;
  const internQuizzes = await Intern.findOne({
    _id: internId,
    "coursesProgress.courseId": quiz.courseId,
    "coursesProgress.quizzes.passed.quizId": previousQuizId,
    "coursesProgress.quizzes.passed.isCompleted": true,
  });

  if (!internQuizzes) {
    return res.status(403).json({
      error: "Complete the previous quiz first",
      requiredQuiz: previousQuizId,
    });
  }

  next();
});

export default checkQuizAccess;
