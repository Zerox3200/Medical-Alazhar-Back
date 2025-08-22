import Course from "../../models/course/course.models.js";
import Quiz from "../../models/course/quiz.models.js";
import Video from "../../models/course/video.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import checkIdValidity from "../../utils/checkIdValidity.js";
import _ from "lodash";

// Create new course
export const createCourse = asyncWrapper(async (req, res, next) => {
  const { published = false, ...courseData } = req.body;

  const courseBanner = req.file?.path.replace(/\\/g, "/");

  if (!courseBanner) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      code: 400,
      message: "Course banner is required",
    });
  }

  const newCourse = new Course({
    published,
    courseBanner,
    ...courseData,
  });

  if (!newCourse)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      message: "Error creating new course",
    });

  await newCourse.save();
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "New course created!",
    course: newCourse,
  });
});

// Add new video
export const addVideosToCourse = asyncWrapper(async (req, res, next) => {
  const { courseId } = req.params;
  checkIdValidity(courseId, res);

  const course = await Course.findById(courseId).lean();
  if (!course)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Course not found",
    });

  const { title, url, duration, level, description } = req.body;

  const newVideo = new Video({
    title,
    url,
    duration,
    level,
    description,
    courseId,
  });

  if (!newVideo)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      message: "Error: Can't add this video",
    });
  await newVideo.save();

  await Course.findByIdAndUpdate(courseId, {
    $push: { videos: newVideo },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "New video added",
    video: newVideo,
  });
});

// Add new quiz
export const addQuizzesToCourse = asyncWrapper(async (req, res, next) => {
  const { courseId } = req.params;
  const { videoId } = req.query;
  const { questions } = req.body;

  checkIdValidity(courseId, res, videoId);

  const [course, video] = await Promise.all([
    Course.findById(courseId).lean(),
    Video.findById(videoId).lean(),
  ]);

  if (!course) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Course not found",
    });
  }

  if (!video) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Video not found",
    });
  }

  if (video.quizId)
    return res.status(422).json({
      code: 422,
      status: httpStatusText.ERROR,
      message: "This video has already a quiz",
    });

  const newQuiz = new Quiz({
    questions,
    courseId,
    videoId,
  });

  if (!newQuiz)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      message: "Error: Can't add this quiz",
    });
  await newQuiz.save();

  await Promise.all([
    Course.findByIdAndUpdate(courseId, {
      $push: { quizzes: newQuiz._id },
    }),
    Video.findByIdAndUpdate(videoId, { quizId: newQuiz._id }),
  ]);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Quiz added successfully",
    data: {
      quiz: newQuiz,
      course: course.title,
      video: video.title,
    },
  });
});

// Get single course
export const getCourseData = asyncWrapper(async (req, res, next) => {
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

// Get all courses
export const getAllCourses = asyncWrapper(async (req, res, next) => {
  const courses = await Course.find()
    .populate("videos", "title url duration")
    .populate("quizzes", "questions")
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

// Get video
export const getVideo = asyncWrapper(async (req, res, next) => {
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

// Get quiz
export const getQuiz = asyncWrapper(async (req, res, next) => {
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

// Post quiz question
export const addQuizQuestion = asyncWrapper(async (req, res, next) => {
  const { quizId } = req.params;
  const { questions } = req.body;
  checkIdValidity(quizId, res);

  const quiz = await Quiz.findByIdAndUpdate(quizId, {
    $addToSet: { questions: { ...questions } },
  });

  if (!quiz)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Failed adding questions.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Questions added successfully.",
  });
});
