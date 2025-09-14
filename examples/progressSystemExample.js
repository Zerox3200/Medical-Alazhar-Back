/**
 * Example usage of the User Progress Management System
 * This file demonstrates how to integrate the progress system with existing course functionality
 */

import UserProgress from "../models/user/userProgress.models.js";
import Course from "../models/course/course.models.js";
import Video from "../models/course/video.models.js";
import Quiz from "../models/course/quiz.models.js";
import {
    shouldUnlockVideo,
    shouldUnlockFinalAssessment,
    calculateQuizScore,
    checkQuizLock,
    generateCertificateUrl
} from "../utils/progressUtils.js";

/**
 * Example: Initialize course progress for a new user
 */
export const initializeCourseProgress = async (userId, courseId) => {
    try {
        const course = await Course.findById(courseId).populate('videos quizzes');
        if (!course) {
            throw new Error('Course not found');
        }

        // Create initial progress with first video unlocked
        const progress = await UserProgress.create({
            userId,
            courseId,
            videos: course.videos.map((video, index) => ({
                videoId: video._id,
                isUnlocked: index === 0, // Only first video unlocked
                isCompleted: false
            })),
            quizzes: {
                passed: [],
                failed: []
            },
            finalAssessment: {
                isUnlocked: false,
                isCompleted: false
            },
            certificate: {
                isEarned: false
            }
        });

        return progress;
    } catch (error) {
        console.error('Error initializing course progress:', error);
        throw error;
    }
};

/**
 * Example: Check if user can access a video
 */
export const canAccessVideo = async (userId, courseId, videoId) => {
    try {
        const progress = await UserProgress.findOne({ userId, courseId });
        if (!progress) {
            return { canAccess: false, reason: 'Not enrolled in course' };
        }

        const course = await Course.findById(courseId);
        const videoProgress = progress.videos.find(v => v.videoId.toString() === videoId);

        if (!videoProgress) {
            return { canAccess: false, reason: 'Video not found in course' };
        }

        if (!videoProgress.isUnlocked) {
            return { canAccess: false, reason: 'Video is locked' };
        }

        return { canAccess: true };
    } catch (error) {
        console.error('Error checking video access:', error);
        throw error;
    }
};

/**
 * Example: Process quiz submission
 */
export const processQuizSubmission = async (userId, courseId, quizId, answers) => {
    try {
        const progress = await UserProgress.findOne({ userId, courseId });
        if (!progress) {
            throw new Error('Course progress not found');
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            throw new Error('Quiz not found');
        }

        // Check if quiz is locked
        const failedQuiz = progress.quizzes.failed.find(q => q.quizId.toString() === quizId);
        const lockStatus = checkQuizLock(failedQuiz);

        if (lockStatus.isLocked) {
            return {
                success: false,
                message: `Quiz is locked. Try again after ${lockStatus.unlockTime}`,
                isLocked: true,
                unlockTime: lockStatus.unlockTime
            };
        }

        // Calculate score
        const scoreResult = calculateQuizScore(quiz.questions, answers);

        if (scoreResult.passed) {
            // Handle successful quiz
            const existingPass = progress.quizzes.passed.find(q => q.quizId.toString() === quizId);

            if (existingPass) {
                existingPass.score = scoreResult.score;
                existingPass.completedAt = new Date();
                existingPass.attempts = (failedQuiz?.attempts || 0) + 1;
            } else {
                progress.quizzes.passed.push({
                    quizId,
                    isCompleted: true,
                    score: scoreResult.score,
                    completedAt: new Date(),
                    attempts: (failedQuiz?.attempts || 0) + 1
                });
            }

            // Remove from failed quizzes
            progress.quizzes.failed = progress.quizzes.failed.filter(q => q.quizId.toString() !== quizId);

            // Unlock next video
            const video = await Video.findOne({ quizId });
            if (video) {
                const course = await Course.findById(courseId);
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
                    // All videos completed, check if final assessment should be unlocked
                    const shouldUnlock = shouldUnlockFinalAssessment(progress, course.videos, course.quizzes);
                    if (shouldUnlock) {
                        progress.finalAssessment.isUnlocked = true;
                    }
                }
            }

            await progress.save();

            return {
                success: true,
                message: 'Quiz passed successfully!',
                score: scoreResult.score,
                nextVideoUnlocked: video ? true : false,
                finalAssessmentUnlocked: !video
            };
        } else {
            // Handle failed quiz
            const attempts = (failedQuiz?.attempts || 0) + 1;

            if (failedQuiz) {
                failedQuiz.attempts = attempts;
                failedQuiz.lastAttemptAt = new Date();
            } else {
                progress.quizzes.failed.push({
                    quizId,
                    attempts,
                    lastAttemptAt: new Date()
                });
            }

            // Check if max attempts reached
            if (attempts >= 3) {
                const failedQuizToUpdate = progress.quizzes.failed.find(q => q.quizId.toString() === quizId);
                failedQuizToUpdate.isLocked = true;
                failedQuizToUpdate.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            }

            await progress.save();

            return {
                success: false,
                message: `Quiz failed. Score: ${scoreResult.score}%. Attempts remaining: ${3 - attempts}`,
                score: scoreResult.score,
                attempts,
                attemptsRemaining: 3 - attempts,
                isLocked: attempts >= 3,
                unlockTime: attempts >= 3 ? new Date(Date.now() + 10 * 60 * 1000) : null
            };
        }
    } catch (error) {
        console.error('Error processing quiz submission:', error);
        throw error;
    }
};

/**
 * Example: Generate course completion certificate
 */
export const generateCourseCertificate = async (userId, courseId) => {
    try {
        const progress = await UserProgress.findOne({ userId, courseId });
        if (!progress) {
            throw new Error('Course progress not found');
        }

        if (!progress.finalAssessment.isCompleted) {
            throw new Error('Course not completed yet');
        }

        if (progress.certificate.isEarned) {
            return {
                alreadyEarned: true,
                certificateUrl: progress.certificate.certificateUrl,
                earnedAt: progress.certificate.earnedAt
            };
        }

        // Generate certificate
        const certificateUrl = generateCertificateUrl(userId, courseId);

        progress.certificate.isEarned = true;
        progress.certificate.earnedAt = new Date();
        progress.certificate.certificateUrl = certificateUrl;

        await progress.save();

        return {
            alreadyEarned: false,
            certificateUrl,
            earnedAt: progress.certificate.earnedAt
        };
    } catch (error) {
        console.error('Error generating certificate:', error);
        throw error;
    }
};

/**
 * Example: Get user's course progress summary
 */
export const getCourseProgressSummary = async (userId, courseId) => {
    try {
        const progress = await UserProgress.findOne({ userId, courseId })
            .populate('videos.videoId', 'title duration')
            .populate('quizzes.passed.quizId', 'questions')
            .populate('quizzes.failed.quizId', 'questions');

        if (!progress) {
            return { enrolled: false };
        }

        const course = await Course.findById(courseId);
        const totalVideos = course.videos.length;
        const totalQuizzes = course.quizzes.length;

        const completedVideos = progress.videos.filter(v => v.isCompleted).length;
        const passedQuizzes = progress.quizzes.passed.length;
        const failedQuizzes = progress.quizzes.failed.length;

        return {
            enrolled: true,
            courseCompleted: progress.isCompleted,
            videoProgress: {
                completed: completedVideos,
                total: totalVideos,
                percentage: Math.round((completedVideos / totalVideos) * 100)
            },
            quizProgress: {
                passed: passedQuizzes,
                failed: failedQuizzes,
                total: totalQuizzes,
                percentage: Math.round((passedQuizzes / totalQuizzes) * 100)
            },
            finalAssessment: {
                unlocked: progress.finalAssessment.isUnlocked,
                completed: progress.finalAssessment.isCompleted,
                score: progress.finalAssessment.score
            },
            certificate: {
                earned: progress.certificate.isEarned,
                url: progress.certificate.certificateUrl
            }
        };
    } catch (error) {
        console.error('Error getting progress summary:', error);
        throw error;
    }
};
