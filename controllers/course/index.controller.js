import checkIdValidity from "../../utils/checkIdValidity.js";
import Intern from "../../models/intern/Intern.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import Course from "../../models/course/course.models.js";
import Video from "../../models/course/video.models.js";
import Quiz from "../../models/course/quiz.models.js";
import _ from "lodash";
import { ErrorCatch } from "../../utils/appError.js";


// Get courses
export const getAllCourses = ErrorCatch(async (req, res, next) => {
  const courses = await Course.find()
    .populate("videos", "title url duration quizId")
    .populate("quizzes", "questions videoId")
    .lean();

  if (!courses)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "No courses.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    count: courses.length,
    courses,
    message: "Fetched successfully.",
  });
});

// Get course data
export const getCourse = ErrorCatch(async (req, res, next) => {
  const { courseId } = req.params;

  checkIdValidity(courseId, res);

  const course = await Course.findById(courseId)
    .populate("videos", "title url duration")
    .populate("quizzes", "questions")
    .lean();

  if (!course)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Course not found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    course,
    message: "Fetched successfully.",
  });
});

// Get quiz
export const getQuiz = ErrorCatch(async (req, res, next) => {
  const { courseId } = req.params;
  const { quizId } = req.query;
  checkIdValidity(courseId, res, quizId);

  const quiz = await Quiz.findById(quizId).lean();

  if (!quiz)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Quiz not found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    quiz,
    message: "Fetched successfully.",
  });
});

// Get video
export const getVideo = ErrorCatch(async (req, res, next) => {
  const { courseId } = req.params;
  const { videoId } = req.query;
  checkIdValidity(courseId, res, videoId);

  const video = await Video.findById(videoId).lean();

  if (!video)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Video not found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    video,
    message: "Fetched successfully.",
  });
});

// Submit video
export const submitVideo = ErrorCatch(async (req, res) => {
  const { courseId } = req.params;
  const { videoId } = req.query;
  const { _id: internId } = req.user;
  const { isCompleted } = req.body;

  checkIdValidity(courseId, res, videoId);

  const video = await Video.findById(videoId);
  if (!video || video.courseId.toString() !== courseId) {
    return res.status(404).json({ error: "Video not found in this course" });
  }

  const [courseVideos, courseQuizzes] = await Promise.all([
    Video.find({ courseId }).sort({ createdAt: 1 }),
    Quiz.find({ courseId }).sort({ createdAt: 1 }),
  ]);

  const currentVideoIndex = courseVideos.findIndex((v) =>
    v._id.equals(videoId)
  );

  // Check prerequisites for non-first videos
  if (currentVideoIndex > 0) {
    const previousVideoId = courseVideos[currentVideoIndex - 1]._id;

    // Check previous video completion
    const prevVideoCompleted = await Intern.exists({
      _id: internId,
      "coursesProgress.courseId": courseId,
      "coursesProgress.videos.videoId": previousVideoId,
      "coursesProgress.videos.isCompleted": true,
    });

    if (!prevVideoCompleted) {
      return res.status(403).json({
        error: "Complete the previous video first",
        requiredVideo: previousVideoId,
      });
    }

    // Check if this video requires a quiz to be completed first
    for (
      let quizIndex = 0;
      quizIndex < Math.min(currentVideoIndex, courseQuizzes.length);
      quizIndex++
    ) {
      const requiredQuizId = courseQuizzes[quizIndex]._id;
      const quizCompleted = await Intern.exists({
        _id: internId,
        "coursesProgress.courseId": courseId,
        "coursesProgress.quizzes.passed.quizId": requiredQuizId,
      });

      if (!quizCompleted) {
        return res.status(403).json({
          error: "Complete the corresponding quiz first",
          requiredQuiz: requiredQuizId,
        });
      }
    }
  }

  // Check if this video completed
  const intern = await Intern.findOne(
    {
      _id: internId,
      "coursesProgress.courseId": courseId,
    },
    "coursesProgress"
  ).lean();

  if (
    !intern ||
    !intern.coursesProgress.some((p) => p.courseId.toString() === courseId)
  ) {
    await Intern.findOneAndUpdate(
      { _id: internId },
      {
        $push: {
          coursesProgress: {
            courseId,
            isCompleted: false,
            completedAt: new Date(),
            videos: [],
            quizzes: { passed: [], failed: [] },
          },
        },
      },
      { upsert: true, new: true }
    );
  }

  const courseProgress = intern?.coursesProgress?.find(
    (progress) => progress.courseId.toString() === courseId
  );

  const currentCourseVideoCompleted = courseProgress?.videos?.some(
    (v) => v.videoId.toString() === videoId
  );

  if (currentCourseVideoCompleted)
    return res.status(400).json({
      status: httpStatusText.ERROR,
      message: "This video is already completed",
    });

  // Update completion status
  const updatedIntern = await Intern.findOneAndUpdate(
    { _id: internId, "coursesProgress.courseId": courseId },
    {
      $addToSet: {
        "coursesProgress.$.videos": {
          videoId,
          isCompleted,
          completedAt: Date.now(),
        },
      },
    },
    { upsert: true, new: true }
  );

  if (!updatedIntern)
    return res.status(400).json({ message: "error updating video" });

  return res.status(200).json({
    status: "success",
    message: "Video completed",
  });
});

// Submit quiz
export const submitQuiz = ErrorCatch(async (req, res, next) => {
  const { courseId } = req.params;
  const { quizId } = req.query;
  const { answers } = req.body;
  const { _id: internId } = req.user;

  checkIdValidity(courseId, res, quizId);

  const [course, quiz] = await Promise.all([
    Course.findById(courseId).lean(),
    Quiz.findById(quizId).lean(),
  ]);

  if (!course || !quiz) {
    return res
      .status(404)
      .json({ message: `${quiz ? "Quiz" : "Course"} not found` });
  }

  if (quiz.questions.length > Object.keys(answers).length) {
    return res
      .status(422)
      .json({ message: "You must answer all the questions." });
  }

  let correctCount = 0;
  quiz.questions.forEach((question, index) => {
    if (question.correctAnswer === answers[index]) {
      correctCount++;
    }
  });

  const passed = correctCount >= Math.ceil(quiz.questions.length * 0.7);

  // Find the intern courses progress
  const intern = await Intern.findOne(
    {
      _id: internId,
      "coursesProgress.courseId": courseId,
    },
    { "coursesProgress.$": 1 }
  ).lean();

  const failedQuiz = intern?.coursesProgress?.[0]?.quizzes?.failed?.find(
    (q) => q.quizId.toString() === quizId
  );

  // Check if quiz is locked and time hasn't expired
  if (failedQuiz?.isLocked && new Date(failedQuiz.lockedUntil) > new Date()) {
    return res.status(403).json({
      message: `Quiz locked due to multiple failed attempts, try again after ${new Date(
        failedQuiz.lockedUntil
      ).toLocaleString()}`,
      unlockTime: failedQuiz.lockedUntil,
    });
  }

  // Handle quiz failed
  if (!passed) {
    const now = new Date();
    const lockDuration = 10 * 60 * 1000;
    const unlockTime = new Date(now.getTime() + lockDuration);

    const update = failedQuiz
      ? {
        $inc: {
          "coursesProgress.$[course].quizzes.failed.$[quiz].attempts": 1,
        },
        $set: {
          "coursesProgress.$[course].quizzes.failed.$[quiz].lastAttempt": now,
          ...(failedQuiz.attempts >= 1 && {
            "coursesProgress.$[course].quizzes.failed.$[quiz].isLocked": true,
            "coursesProgress.$[course].quizzes.failed.$[quiz].lockedUntil":
              unlockTime,
          }),
        },
      }
      : {
        $push: {
          "coursesProgress.$[course].quizzes.failed": {
            quizId,
            attempts: 1,
            lastAttempt: now,
            isLocked: false,
            lockedUntil: null,
          },
        },
      };

    await Intern.findOneAndUpdate(
      { _id: internId, "coursesProgress.courseId": courseId },
      update,
      {
        arrayFilters: [
          { "course.courseId": courseId },
          ...(failedQuiz ? [{ "quiz.quizId": quizId }] : []),
        ],
        new: true,
      }
    );

    const attemptsLeft = 2 - ((failedQuiz?.attempts || 0) + 1);

    return res.status(400).json({
      status: "fail",
      score: `${correctCount}/${quiz.questions.length}`,
      attempts: (failedQuiz?.attempts || 0) + 1,
      ...(attemptsLeft <= 0
        ? {
          message: `Quiz locked until ${unlockTime.toLocaleString()}`,
          unlockTime,
        }
        : {
          message: `${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""
            } left`,
        }),
    });
  }

  const courseProgress = intern?.coursesProgress?.find(
    (progress) => progress.courseId.toString() === courseId
  );

  const existingPass = courseProgress?.quizzes?.passed?.some(
    (q) => q.quizId.toString() === quizId
  );

  if (existingPass && !req.query.forceRetake) {
    return res.status(400).json({
      status: "error",
      message: "You already passed this quiz!",
      previousScore: existingPass.score,
      passedAt: existingPass.completedAt,
    });
  }

  const updateOperation = existingPass
    ? {
      $set: {
        "coursesProgress.$[course].quizzes.passed.$[quiz].score":
          correctCount,
        "coursesProgress.$[course].quizzes.passed.$[quiz].completedAt":
          new Date(),
        "coursesProgress.$[course].quizzes.passed.$[quiz].isCompleted": true,
      },
    }
    : {
      $push: {
        "coursesProgress.$[course].quizzes.passed": {
          quizId,
          isCompleted: true,
          score: correctCount,
          completedAt: new Date(),
          attempts: (failedQuiz?.attempts || 0) + 1,
        },
      },
    };

  // Handle quiz pass

  const updatedIntern = await Intern.findOneAndUpdate(
    { _id: internId, "coursesProgress.courseId": courseId },
    {
      $pull: { "coursesProgress.$[course].quizzes.failed": { quizId } },
      ...updateOperation,
    },
    {
      arrayFilters: [
        { "course.courseId": courseId },
        ...(existingPass ? [{ "quiz.quizId": quizId }] : []),
      ],
      new: true,
    }
  );

  // Check course completion

  const courseCompletion = updatedIntern.coursesProgress.find(
    (p) => p.courseId.toString() === courseId
  );

  // Check if all videos and quizzes are completed
  const isCourseComplete =
    courseProgress?.videos?.every((video) => video.isCompleted) &&
    courseProgress?.quizzes?.passed?.every((quiz) => quiz.isCompleted);

  // Mark course as completed if all requirements met
  if (
    isCourseComplete &&
    course.videos.length === courseCompletion.videos.length &&
    course.quizzes.length === courseCompletion.quizzes.passed.length
  ) {
    await Intern.updateOne(
      { _id: internId, "coursesProgress.courseId": courseId },
      { $set: { "coursesProgress.$.isCompleted": true } }
    );
  }
  const percent = Math.round((correctCount / quiz.questions.length) * 100);
  return res.status(200).json({
    status: "success",
    score: `${correctCount}/${quiz.questions.length}`,
    attempts: (failedQuiz?.attempts || 0) + 1,
    message: `Passed with ${percent}%`,
  });
});
