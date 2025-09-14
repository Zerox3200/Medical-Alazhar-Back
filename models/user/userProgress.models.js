import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    completedAt: {
        type: Date,
    },
    videos: [
        {
            videoId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
                required: true,
            },
            isCompleted: {
                type: Boolean,
                default: false,
            },
            completedAt: {
                type: Date,
            },
            isUnlocked: {
                type: Boolean,
                default: false,
            },
        },
    ],
    quizzes: {
        passed: [
            {
                quizId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Quiz",
                    required: true,
                },
                isCompleted: {
                    type: Boolean,
                    default: false,
                },
                score: {
                    type: Number,
                    default: 0,
                    min: 0,
                },
                completedAt: {
                    type: Date,
                },
                attempts: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        failed: [
            {
                quizId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Quiz",
                    required: true,
                },
                attempts: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 3,
                },
                isLocked: {
                    type: Boolean,
                    default: false,
                },
                lockedUntil: {
                    type: Date,
                },
                lastAttemptAt: {
                    type: Date,
                },
            },
        ],
    },
    finalAssessment: {
        isUnlocked: {
            type: Boolean,
            default: false,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        score: {
            type: Number,
            default: 0,
        },
        completedAt: {
            type: Date,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        isLocked: {
            type: Boolean,
            default: false,
        },
        lockedUntil: {
            type: Date,
        },
    },
    certificate: {
        isEarned: {
            type: Boolean,
            default: false,
        },
        earnedAt: {
            type: Date,
        },
        certificateUrl: {
            type: String,
        },
    },
}, {
    timestamps: true,
});

// Index for efficient queries
userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const UserProgress = mongoose.models.UserProgress || mongoose.model("UserProgress", userProgressSchema);

export default UserProgress;
