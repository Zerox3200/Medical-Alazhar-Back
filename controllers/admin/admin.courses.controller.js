import Course from "../../models/course/course.models.js";
import Quiz from "../../models/course/quiz.models.js";
import Video from "../../models/course/video.models.js";
import Chapter from "../../models/course/chapter.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import checkIdValidity from "../../utils/checkIdValidity.js";
import _ from "lodash";
import { ErrorCatch } from "../../utils/appError.js";
import { deleteImage, deleteVideo } from "../../services/cloudnairyUpload.js";

// Create new course
export const createCourse = ErrorCatch(async (req, res, next) => {
  const { title, description, mentor, tags } = req.body;


  // Get the uploaded file info from the middleware
  const courseBanner = req.uploadedFile ? req.uploadedFile.url : null;


  const course = await Course.create({ title, description, courseBanner, mentor, tags });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    code: 201,
    course,
    message: "Course created successfully.",
    success: true,
  });
});

// Update course
export const updateCourse = asyncWrapper(async (req, res, next) => {
  const { courseId } = req.params;
  const { title, description, mentor, tags, published } = req.body;

  const courseBanner = req.uploadedFile ? req.uploadedFile.url : null;


  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Course not found.",
      success: false,
    });
  }

  if (courseBanner) {
    await deleteImage(course.courseBanner);
  }

  let updatedCourse

  if (courseBanner) {
    updatedCourse = await Course.findByIdAndUpdate(courseId, { title, description, mentor, tags, published, courseBanner }, { new: true });
  } else {
    updatedCourse = await Course.findByIdAndUpdate(courseId, { title, description, mentor, tags, published }, { new: true });
  }

  if (!updatedCourse) {
    return res.status(200).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Failed to update course.",
      success: false,
    });
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    course: updatedCourse,
    message: "Course updated successfully.",
    success: true,
  });
});


// Delete course
export const deleteCourse = asyncWrapper(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Course not found.",
      success: false,
    });
  }

  if (course.courseBanner) {
    const deletedCourseBanner = await deleteImage(course.courseBanner);

    if (!deletedCourseBanner.success) {
      console.warn('Failed to delete course banner:', deletedCourseBanner.error);
    } else {
      console.log('Course banner deleted successfully:', deletedCourseBanner.public_id);
    }
  }

  // Get all videos for this course to delete them from Cloudinary
  const courseVideos = await Video.find({ courseId });

  // Delete videos from Cloudinary
  for (const video of courseVideos) {
    if (video.url) {
      try {
        const deletedVideo = await deleteVideo(video.url);
        if (!deletedVideo.success) {
          console.warn('Failed to delete video from Cloudinary:', video.url, deletedVideo.error);
        } else {
          console.log('Video deleted from Cloudinary successfully:', video.url);
        }
      } catch (error) {
        console.error('Error deleting video from Cloudinary:', error);
      }
    }
  }

  const [deletedCourse, deletedVideos, deletedQuizzes] = await Promise.all([
    Course.findByIdAndDelete(courseId),
    Video.deleteMany({ courseId }),
    Quiz.deleteMany({ courseId }),
  ]);


  if (!deletedCourse) {
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Course not found.",
      success: false,
    });
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Course deleted successfully.",
    success: true,
  });
});

// Get available videos
export const getAvailableVideos = asyncWrapper(async (req, res, next) => {

  const { courseId } = req.params;

  const availableVideos = await Video.find({ courseId, quizId: null }).select("title _id");

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    availableVideos,
    success: true,
  });
});

// Add new video to chapter
export const addVideosToCourse = asyncWrapper(async (req, res, next) => {

  const { courseId } = req.params;
  const { chapterId, title, level, description, duration } = req.body;

  checkIdValidity(courseId, res, chapterId);

  const [course, chapter] = await Promise.all([
    Course.findById(courseId).lean(),
    Chapter.findById(chapterId).lean(),
  ]);

  if (!course || !chapter) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Course or chapter not found",
    });
  }

  // Verify chapter belongs to the course
  if (chapter.courseId.toString() !== courseId) {
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Chapter does not belong to this course",
    });
  }


  // Get the uploaded video file info from the middleware
  const videoUrl = req.uploadedFile ? req.uploadedFile.url : null;

  if (!videoUrl) {
    return res.status(400).json({
      status: httpStatusText.ERROR,
      message: "Video file is required",
    });
  }

  const newVideo = new Video({
    title,
    url: videoUrl,
    duration,
    level,
    description,
    courseId,
    chapterId,
  });

  if (!newVideo)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      message: "Error: Can't add this video",
    });
  await newVideo.save();

  // Add video to chapter
  await Chapter.findByIdAndUpdate(chapterId, {
    $push: { videos: newVideo._id },
  });

  // Add video to course (for backward compatibility)
  await Course.findByIdAndUpdate(courseId, {
    $push: { videos: newVideo._id },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "New video added successfully",
    video: newVideo,
    uploadInfo: {
      url: videoUrl,
      duration,
      size: req.uploadedFile.size,
      format: req.uploadedFile.format
    },
    success: true,
  });
});

// Update video
export const updateVideo = asyncWrapper(async (req, res, next) => {
  const { videoId, chapterId } = req.params;
  const { title, level, description, duration } = req.body;
  const videoUrl = req.uploadedFile ? req.uploadedFile.url : null;

  checkIdValidity(videoId);
  checkIdValidity(chapterId, res);
  const video = await Video.findById(videoId);


  if (!video) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Video not found",
    });
  }

  if (video.chapterId.toString() !== chapterId) {

    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Video does not belong to this chapter",
    });
  }

  const chapter = await Chapter.findById(chapterId);

  if (!chapter) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Chapter not found",
    });
  }

  if (videoUrl) {
    const deletedVideo = await deleteVideo(video.url);

    if (!deletedVideo.success) {
      return res.status(400).json({
        code: 400,
        status: httpStatusText.ERROR,
        message: "Failed to delete video",
      });
    }
  }

  let updatedVideo

  if (videoUrl) {
    updatedVideo = await Video.findByIdAndUpdate(videoId, { title, level, description, duration, url: videoUrl }, { new: true });
  } else {
    updatedVideo = await Video.findByIdAndUpdate(videoId, { title, level, description, duration }, { new: true });
  }

  if (!updatedVideo) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Failed to update video",
    });
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Video updated successfully",
    video: updatedVideo,
    success: true,
  });
});

// Delete video from course
export const deleteVideoFromCourse = asyncWrapper(async (req, res, next) => {
  const { videoId, chapterId } = req.params;

  checkIdValidity(videoId);

  checkIdValidity(chapterId, res);

  const video = await Video.findById(videoId);

  if (!video) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Video not found",
      success: false,
    });
  }

  const deletedVideo = await deleteVideo(video.url);

  if (!deletedVideo.success) {
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Failed to delete video",
      success: false,
    });
  }

  const [deletedVideoFromDB, deletedVideoFromChapter, deletedQuizFromDB] = await Promise.all([
    Video.findByIdAndDelete(videoId),
    Chapter.findByIdAndUpdate(chapterId, { $pull: { videos: videoId } }),
    Quiz.findOneAndDelete({ videoId }),
  ]);

  if (!deletedVideoFromDB) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Video not found",
      success: false,
    });
  }

  if (!deletedVideoFromChapter) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Chapter not found",
      success: false,
    });
  }

  const updatedCourse = await Course.findByIdAndUpdate(video.courseId, { $pull: { videos: videoId } });

  if (!updatedCourse) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Course not found",
      success: false,
    });
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Video deleted successfully",
    success: true,
  });
});

// Update course status
export const updateCourseStatus = asyncWrapper(async (req, res, next) => {
  const { courseId } = req.params;
  const { published } = req.body;

  checkIdValidity(courseId, res);

  const course = await Course.findById(courseId).populate("sections");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  // Allow publishing courses with sections even if they don't have chapters yet
  if (course.sections.length === 0) {
    return res.status(422).json({
      success: false,
      message: "You can't publish a course without sections",
    });
  }

  const updatedCourse = await Course.findByIdAndUpdate(courseId, { published }, { new: true });

  return res.status(200).json({
    message: "Course status updated successfully",
    course: updatedCourse,
    success: true,
  });
});

// update course paid status
export const updateCoursePaidStatus = asyncWrapper(async (req, res, next) => {
  const { courseId } = req.params;
  const { paid, price } = req.body;

  checkIdValidity(courseId, res);

  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      success: false,
      message: "Course not found",
    });
  }

  if (!course.sections.length) {
    return res.status(422).json({
      code: 422,
      status: httpStatusText.ERROR,
      success: false,
      message: "You can't update the paid status of a course without sections",
      success: false,
    });
  }

  let updatedCourse

  if (!paid) {
    updatedCourse = await Course.findByIdAndUpdate(courseId, { paid, price: 0 }, { new: true });
  } else {
    updatedCourse = await Course.findByIdAndUpdate(courseId, { paid, price }, { new: true });
  }

  return res.status(200).json({
    message: "Course paid status updated successfully",
    course: updatedCourse,
    success: true,
  });
});

// Delete quiz
export const deleteQuiz = asyncWrapper(async (req, res, next) => {
  const { quizId } = req.params;

  checkIdValidity(quizId, res);

  const quiz = await Quiz.findById(quizId).lean();
  const video = await Video.findById(quiz.videoId.toString()).lean();

  if (!quiz || !video) {
    return res.status(404).json({
      success: false,
      message: "Quiz or video not found",
    });
  }

  const deletedQuizFromDB = await Quiz.findByIdAndDelete(quizId);

  if (!deletedQuizFromDB) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  const deletedQuizFromVideo = await Video.findByIdAndUpdate(video._id, { quizId: null }, { new: true });

  if (!deletedQuizFromVideo) {
    return res.status(404).json({
      success: false,
      message: "Video not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Quiz deleted successfully",
  });
})

// Get quiz by id ( for admin only )
export const getQuizById = asyncWrapper(async (req, res, next) => {

  const { quizId } = req.params;
  checkIdValidity(quizId, res);

  const quiz = await Quiz.findById(quizId).lean();

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Quiz fetched successfully",
    quiz,
  });
});

// Get single course
export const getCourseData = asyncWrapper(async (req, res, next) => {
  const { courseId } = req.params;

  checkIdValidity(courseId, res);

  const course = await Course.findById(courseId)
    .populate({
      path: "sections",
      select: "title description order isPublished",
      options: { sort: { order: 1 } },
      populate: {
        path: "chapters",
        select: "title description order isPublished",
        options: { sort: { order: 1 } },
        populate: {
          path: "videos",
          select: "title url duration description level quizId",
          options: { sort: { createdAt: 1 } },
          populate: {
            path: "quizId",
            select: "questions videoId", // what you want to show
            populate: {
              path: "videoId",
              select: "title"
            }
          }
        }
      },
    })
    .populate({
      path: "videos",
      select: "title url duration description level quizId",
      populate: {
        path: "quizId",
        select: "questions videoId",
        populate: {
          path: "videoId",
          select: "title"
        }
      }
    })
    .populate({
      path: "quizzes",
      select: "questions videoId",
      populate: {
        path: "videoId",
        select: "title"
      }
    })
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
    .populate({
      path: "sections",
      select: "title description order isPublished",
      options: { sort: { order: 1 } },
    })
    .populate("videos", "title url duration")
    .populate("quizzes", "questions")
    .lean();

  const publishedCourses = courses.filter(course => course.published).length;
  const totalCourses = courses.length;
  const unpublishedCourses = totalCourses - publishedCourses;

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
    totalCourses,
    unpublishedCourses,
    publishedCourses,
    courses,
    message: "Fetched successfully.",
    success: true,
  });
});

// Add new quiz
export const addQuizzesToCourse = asyncWrapper(async (req, res, next) => {
  const { questions, videoId, courseId } = req.body;

  checkIdValidity(courseId, res, videoId);

  const [course, video] = await Promise.all([
    Course.findById(courseId).lean(),
    Video.findById(videoId).lean(),
  ]);

  if (!course || !video) {
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Course not found",
      success: false,
    });
  }

  if (video.quizId)
    return res.status(422).json({
      code: 422,
      status: httpStatusText.ERROR,
      message: "This video has already a quiz",
      success: false,
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
      success: false,
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
    success: true,
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

// Update quiz
export const updateQuiz = asyncWrapper(async (req, res, next) => {
  const { quizId } = req.params;
  const { questions, videoId, oldVideoId } = req.body;

  checkIdValidity(quizId, res, videoId, oldVideoId);

  const quiz = await Quiz.findById(quizId);
  const [video, oldVideo] = await Promise.all([
    Video.findById(videoId),
    Video.findById(oldVideoId),
  ]);

  if (!quiz || !video || !oldVideo) {
    return res.status(404).json({
      success: false,
      message: "Quiz or video not found",
    });
  }

  // If video is being changed, update references
  if (oldVideoId !== videoId) {
    const [deletedQuizFromOldVideo, addedQuizToNewVideo] = await Promise.all([
      Video.findByIdAndUpdate(oldVideo._id, { quizId: null }, { new: true }),
      Video.findByIdAndUpdate(video._id, { quizId }, { new: true }),
    ]);

    if (!deletedQuizFromOldVideo || !addedQuizToNewVideo) {
      return res.status(500).json({
        success: false,
        message: "Failed to reassign quiz to the new video",
      });
    }
  }

  // Update the quiz itself
  const updatedQuiz = await Quiz.findByIdAndUpdate(
    quizId,
    { questions, videoId },
    { new: true }
  );

  if (!updatedQuiz) {
    return res.status(500).json({
      success: false,
      message: "Failed to update quiz",
    });
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Quiz updated successfully.",
    quiz: updatedQuiz,
    success: true,
  });
});
