/**
 * Utility functions for course progress management
 */

/**
 * Check if a video should be unlocked based on course progress
 * @param {Object} progress - User progress object
 * @param {string} videoId - Video ID to check
 * @param {Array} courseVideos - Array of course video IDs in order
 * @returns {boolean} - Whether video should be unlocked
 */
export const shouldUnlockVideo = (progress, videoId, courseVideos) => {
    const videoIndex = courseVideos.findIndex(v => v.toString() === videoId);

    // First video is always unlocked
    if (videoIndex === 0) return true;

    // Check if previous video is completed
    const previousVideoId = courseVideos[videoIndex - 1];
    const previousVideoProgress = progress.videos.find(v =>
        v.videoId.toString() === previousVideoId.toString()
    );

    if (!previousVideoProgress || !previousVideoProgress.isCompleted) {
        return false;
    }

    // Check if previous video's quiz is passed (if it has one)
    // This would need to be checked against the actual quiz data
    return true;
};

/**
 * Check if all course requirements are met for final assessment
 * @param {Object} progress - User progress object
 * @param {Array} courseVideos - Array of course video IDs
 * @param {Array} courseQuizzes - Array of course quiz IDs
 * @returns {boolean} - Whether final assessment should be unlocked
 */
export const shouldUnlockFinalAssessment = (progress, courseVideos, courseQuizzes) => {
    // Check if all videos are completed
    const allVideosCompleted = courseVideos.every(videoId => {
        const videoProgress = progress.videos.find(v => v.videoId.toString() === videoId.toString());
        return videoProgress && videoProgress.isCompleted;
    });

    if (!allVideosCompleted) return false;

    // Check if all quizzes are passed
    const allQuizzesPassed = courseQuizzes.every(quizId => {
        const quizProgress = progress.quizzes.passed.find(q => q.quizId.toString() === quizId.toString());
        return quizProgress && quizProgress.isCompleted;
    });

    return allQuizzesPassed;
};

/**
 * Calculate quiz score percentage
 * @param {Array} questions - Quiz questions array
 * @param {Object} answers - User answers object
 * @returns {Object} - Score details
 */
export const calculateQuizScore = (questions, answers) => {
    let correctCount = 0;
    const totalQuestions = questions.length;

    questions.forEach((question, index) => {
        if (question.correctAnswer === answers[index]) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;

    return {
        correctCount,
        totalQuestions,
        score,
        passed
    };
};

/**
 * Check if quiz is locked due to failed attempts
 * @param {Object} failedQuiz - Failed quiz progress object
 * @returns {Object} - Lock status
 */
export const checkQuizLock = (failedQuiz) => {
    if (!failedQuiz || !failedQuiz.isLocked) {
        return { isLocked: false };
    }

    const now = new Date();
    const lockedUntil = new Date(failedQuiz.lockedUntil);

    if (now > lockedUntil) {
        // Lock has expired, reset it
        return {
            isLocked: false,
            shouldReset: true
        };
    }

    return {
        isLocked: true,
        unlockTime: lockedUntil
    };
};

/**
 * Generate certificate URL
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {string} - Certificate URL
 */
export const generateCertificateUrl = (userId, courseId) => {
    const timestamp = Date.now();
    return `/certificates/${userId}_${courseId}_${timestamp}.pdf`;
};

/**
 * Format time remaining for locked quiz
 * @param {Date} unlockTime - Time when quiz will be unlocked
 * @returns {string} - Formatted time string
 */
export const formatUnlockTime = (unlockTime) => {
    return new Date(unlockTime).toLocaleString();
};
