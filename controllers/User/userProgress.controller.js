import UserProgress from "../../models/user/userProgress.models.js";
import Course from "../../models/course/course.models.js";
import Video from "../../models/course/video.models.js";
import Quiz from "../../models/course/quiz.models.js";
import httpStatusText from "../../utils/httpStatusText.js";
import { ErrorCatch } from "../../utils/appError.js";
import checkIdValidity from "../../utils/checkIdValidity.js";

// Get user progress for a specific course
export const getUserCourseProgress = ErrorCatch(async (req, res, next) => {
    const { courseId } = req.params;
    const { _id: userId } = req.user;

    checkIdValidity(courseId, res);

    const course = await Course.findById(courseId).populate('videos quizzes');
    if (!course) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course not found",
            success: false,
        });
    }

    let progress = await UserProgress.findOne({ userId, courseId });

    // If no progress exists, create initial progress
    if (!progress) {
        progress = await UserProgress.create({
            userId,
            courseId,
            videos: course.videos.map(video => ({
                videoId: video._id,
                isUnlocked: video === course.videos[0] // First video is unlocked by default
            }))
        });
    }

    // Populate video and quiz details
    const populatedProgress = await UserProgress.findById(progress._id)
        .populate('videos.videoId', 'title description duration url')
        .populate('quizzes.passed.quizId', 'questions')
        .populate('quizzes.failed.quizId', 'questions');

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "Course progress retrieved successfully",
        success: true,
        data: {
            course: {
                title: course.title,
                description: course.description,
                courseBanner: course.courseBanner,
                mentor: course.mentor,
            },
            progress: populatedProgress,
        },
    });
});

// Submit video completion
export const submitVideoCompletion = ErrorCatch(async (req, res, next) => {
    const { courseId, videoId } = req.params;
    const { _id: userId } = req.user;

    checkIdValidity(courseId, res, videoId);

    const [course, video] = await Promise.all([
        Course.findById(courseId),
        Video.findById(videoId),
    ]);

    if (!course || !video) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course or video not found",
            success: false,
        });
    }

    let progress = await UserProgress.findOne({ userId, courseId });

    if (!progress) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "You must be enrolled in this course first",
            success: false,
        });
    }

    // Check if video is unlocked
    const videoProgress = progress.videos.find(v => v.videoId.toString() === videoId);
    if (!videoProgress || !videoProgress.isUnlocked) {
        return res.status(403).json({
            status: httpStatusText.ERROR,
            code: 403,
            message: "This video is locked. Complete the previous video and its quiz first",
            success: false,
        });
    }

    // Check if already completed
    if (videoProgress.isCompleted) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "This video is already completed",
            success: false,
        });
    }

    // Mark video as completed
    videoProgress.isCompleted = true;
    videoProgress.completedAt = new Date();
    await progress.save();

    // Unlock next video if this video has a quiz
    const videoQuiz = await Quiz.findOne({ videoId });
    if (videoQuiz) {
        // Unlock the quiz for this video
        const quizIndex = course.quizzes.findIndex(q => q.toString() === videoQuiz._id.toString());
        if (quizIndex !== -1) {
            // Quiz is unlocked when video is completed
            res.status(200).json({
                status: httpStatusText.SUCCESS,
                code: 200,
                message: "Video completed successfully. Quiz is now available",
                success: true,
                data: {
                    videoCompleted: true,
                    quizUnlocked: true,
                    quizId: videoQuiz._id,
                },
            });
        } else {
            res.status(200).json({
                status: httpStatusText.SUCCESS,
                code: 200,
                message: "Video completed successfully",
                success: true,
                data: {
                    videoCompleted: true,
                    quizUnlocked: false,
                },
            });
        }
    } else {
        // No quiz for this video, unlock next video
        const currentVideoIndex = course.videos.findIndex(v => v.toString() === videoId);
        const nextVideoIndex = currentVideoIndex + 1;

        if (nextVideoIndex < course.videos.length) {
            const nextVideoProgress = progress.videos.find(v =>
                v.videoId.toString() === course.videos[nextVideoIndex].toString()
            );
            if (nextVideoProgress) {
                nextVideoProgress.isUnlocked = true;
                await progress.save();
            }
        }

        res.status(200).json({
            status: httpStatusText.SUCCESS,
            code: 200,
            message: "Video completed successfully. Next video unlocked",
            success: true,
            data: {
                videoCompleted: true,
                nextVideoUnlocked: nextVideoIndex < course.videos.length,
            },
        });
    }
});

// Submit quiz
export const submitQuiz = ErrorCatch(async (req, res, next) => {
    const { courseId, quizId } = req.params;
    const { answers } = req.body;
    const { _id: userId } = req.user;

    checkIdValidity(courseId, res, quizId);

    const [course, quiz] = await Promise.all([
        Course.findById(courseId),
        Quiz.findById(quizId),
    ]);

    if (!course || !quiz) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course or quiz not found",
            success: false,
        });
    }

    if (quiz.questions.length > Object.keys(answers).length) {
        return res.status(422).json({
            status: httpStatusText.ERROR,
            code: 422,
            message: "You must answer all questions",
            success: false,
        });
    }

    let progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "You must be enrolled in this course first",
            success: false,
        });
    }

    // Check if quiz is locked
    const failedQuiz = progress.quizzes.failed.find(q => q.quizId.toString() === quizId);
    if (failedQuiz?.isLocked && new Date(failedQuiz.lockedUntil) > new Date()) {
        return res.status(403).json({
            status: httpStatusText.ERROR,
            code: 403,
            message: `Quiz is locked due to multiple failed attempts. Try again after ${new Date(failedQuiz.lockedUntil).toLocaleString()}`,
            success: false,
            unlockTime: failedQuiz.lockedUntil,
        });
    }

    // Calculate score
    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
        if (question.correctAnswer === answers[index]) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= 70;

    // Check if already passed
    const existingPass = progress.quizzes.passed.find(q => q.quizId.toString() === quizId);
    if (existingPass && !req.query.forceRetake) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "You already passed this quiz",
            success: false,
            data: {
                previousScore: existingPass.score,
                passedAt: existingPass.completedAt,
            },
        });
    }

    if (passed) {
        // Handle quiz pass
        if (existingPass) {
            // Update existing pass
            existingPass.score = score;
            existingPass.completedAt = new Date();
            existingPass.attempts = (failedQuiz?.attempts || 0) + 1;
        } else {
            // Add new pass
            progress.quizzes.passed.push({
                quizId,
                isCompleted: true,
                score,
                completedAt: new Date(),
                attempts: (failedQuiz?.attempts || 0) + 1,
            });
        }

        // Remove from failed quizzes
        progress.quizzes.failed = progress.quizzes.failed.filter(q => q.quizId.toString() !== quizId);

        // Unlock next video
        const video = await Video.findOne({ quizId });
        if (video) {
            const currentVideoIndex = course.videos.findIndex(v => v.toString() === video._id.toString());
            const nextVideoIndex = currentVideoIndex + 1;

            if (nextVideoIndex < course.videos.length) {
                const nextVideoProgress = progress.videos.find(v =>
                    v.videoId.toString() === course.videos[nextVideoIndex].toString()
                );
                if (nextVideoProgress) {
                    nextVideoProgress.isUnlocked = true;
                }
            } else {
                // All videos completed, unlock final assessment
                progress.finalAssessment.isUnlocked = true;
            }
        }

        await progress.save();

        res.status(200).json({
            status: httpStatusText.SUCCESS,
            code: 200,
            message: "Quiz passed successfully! Next video unlocked",
            success: true,
            data: {
                passed: true,
                score,
                nextVideoUnlocked: video ? true : false,
                finalAssessmentUnlocked: !video,
            },
        });
    } else {
        // Handle quiz failure
        const attempts = (failedQuiz?.attempts || 0) + 1;

        if (failedQuiz) {
            failedQuiz.attempts = attempts;
            failedQuiz.lastAttemptAt = new Date();
        } else {
            progress.quizzes.failed.push({
                quizId,
                attempts,
                lastAttemptAt: new Date(),
            });
        }

        // Check if max attempts reached
        if (attempts >= 3) {
            const failedQuizToUpdate = progress.quizzes.failed.find(q => q.quizId.toString() === quizId);
            failedQuizToUpdate.isLocked = true;
            failedQuizToUpdate.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        }

        await progress.save();

        res.status(200).json({
            status: httpStatusText.SUCCESS,
            code: 200,
            message: `Quiz failed. Score: ${score}%. Attempts remaining: ${3 - attempts}`,
            success: true,
            data: {
                passed: false,
                score,
                attempts,
                attemptsRemaining: 3 - attempts,
                isLocked: attempts >= 3,
                unlockTime: attempts >= 3 ? new Date(Date.now() + 10 * 60 * 1000) : null,
            },
        });
    }
});

// Submit final assessment
export const submitFinalAssessment = ErrorCatch(async (req, res, next) => {
    const { courseId } = req.params;
    const { answers } = req.body;
    const { _id: userId } = req.user;

    checkIdValidity(courseId, res);

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course not found",
            success: false,
        });
    }

    let progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "You must be enrolled in this course first",
            success: false,
        });
    }

    // Check if final assessment is unlocked
    if (!progress.finalAssessment.isUnlocked) {
        return res.status(403).json({
            status: httpStatusText.ERROR,
            code: 403,
            message: "Complete all course videos and quizzes first",
            success: false,
        });
    }

    // Check if final assessment is locked
    if (progress.finalAssessment.isLocked && new Date(progress.finalAssessment.lockedUntil) > new Date()) {
        return res.status(403).json({
            status: httpStatusText.ERROR,
            code: 403,
            message: `Final assessment is locked due to multiple failed attempts. Try again after ${new Date(progress.finalAssessment.lockedUntil).toLocaleString()}`,
            success: false,
            unlockTime: progress.finalAssessment.lockedUntil,
        });
    }

    // Get all course quizzes for final assessment
    const courseQuizzes = await Quiz.find({ courseId });
    const totalQuestions = courseQuizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);

    if (Object.keys(answers).length < totalQuestions) {
        return res.status(422).json({
            status: httpStatusText.ERROR,
            code: 422,
            message: "You must answer all questions in the final assessment",
            success: false,
        });
    }

    // Calculate score
    let correctCount = 0;
    let questionIndex = 0;

    for (const quiz of courseQuizzes) {
        for (const question of quiz.questions) {
            if (question.correctAnswer === answers[questionIndex]) {
                correctCount++;
            }
            questionIndex++;
        }
    }

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;

    // Check if already passed
    if (progress.finalAssessment.isCompleted && !req.query.forceRetake) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "You already completed the final assessment",
            success: false,
            data: {
                previousScore: progress.finalAssessment.score,
                completedAt: progress.finalAssessment.completedAt,
            },
        });
    }

    if (passed) {
        // Handle final assessment pass
        progress.finalAssessment.isCompleted = true;
        progress.finalAssessment.score = score;
        progress.finalAssessment.completedAt = new Date();
        progress.finalAssessment.attempts = (progress.finalAssessment.attempts || 0) + 1;

        // Mark course as completed
        progress.isCompleted = true;
        progress.completedAt = new Date();

        // Generate certificate
        progress.certificate.isEarned = true;
        progress.certificate.earnedAt = new Date();
        progress.certificate.certificateUrl = `/certificates/${userId}_${courseId}_${Date.now()}.pdf`;

        await progress.save();

        res.status(200).json({
            status: httpStatusText.SUCCESS,
            code: 200,
            message: "Congratulations! You have completed the course and earned your certificate",
            success: true,
            data: {
                passed: true,
                score,
                courseCompleted: true,
                certificateEarned: true,
                certificateUrl: progress.certificate.certificateUrl,
            },
        });
    } else {
        // Handle final assessment failure
        const attempts = (progress.finalAssessment.attempts || 0) + 1;
        progress.finalAssessment.attempts = attempts;
        progress.finalAssessment.lastAttemptAt = new Date();

        // Check if max attempts reached
        if (attempts >= 3) {
            progress.finalAssessment.isLocked = true;
            progress.finalAssessment.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        }

        await progress.save();

        res.status(200).json({
            status: httpStatusText.SUCCESS,
            code: 200,
            message: `Final assessment failed. Score: ${score}%. Attempts remaining: ${3 - attempts}`,
            success: true,
            data: {
                passed: false,
                score,
                attempts,
                attemptsRemaining: 3 - attempts,
                isLocked: attempts >= 3,
                unlockTime: attempts >= 3 ? new Date(Date.now() + 10 * 60 * 1000) : null,
            },
        });
    }
});

// Get user's certificate
export const getUserCertificate = ErrorCatch(async (req, res, next) => {
    const { courseId } = req.params;
    const { _id: userId } = req.user;

    checkIdValidity(courseId, res);

    const progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course progress not found",
            success: false,
        });
    }

    if (!progress.certificate.isEarned) {
        return res.status(403).json({
            status: httpStatusText.ERROR,
            code: 403,
            message: "Certificate not earned yet. Complete the course first",
            success: false,
        });
    }

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course not found",
            success: false,
        });
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "Certificate retrieved successfully",
        success: true,
        data: {
            certificate: {
                courseTitle: course.title,
                earnedAt: progress.certificate.earnedAt,
                certificateUrl: progress.certificate.certificateUrl,
                finalScore: progress.finalAssessment.score,
            },
        },
    });
});

// Reset quiz attempts (admin function)
export const resetQuizAttempts = ErrorCatch(async (req, res, next) => {
    const { courseId, quizId } = req.params;
    const { _id: userId } = req.user;

    checkIdValidity(courseId, res, quizId);

    const progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course progress not found",
            success: false,
        });
    }

    // Reset failed quiz attempts
    const failedQuiz = progress.quizzes.failed.find(q => q.quizId.toString() === quizId);
    if (failedQuiz) {
        failedQuiz.attempts = 0;
        failedQuiz.isLocked = false;
        failedQuiz.lockedUntil = null;
        failedQuiz.lastAttemptAt = null;
    }

    await progress.save();

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "Quiz attempts reset successfully",
        success: true,
    });
});
