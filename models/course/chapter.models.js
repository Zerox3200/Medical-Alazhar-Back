import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Chapter title is required"],
    },
    description: {
        type: String,
        required: [true, "Chapter description is required"],
    },
    order: {
        type: Number,
        required: [true, "Chapter order is required"],
        min: 1,
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
        required: [true, "Section ID is required"],
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course ID is required"],
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    }],
    isPublished: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Ensure unique order within a section
chapterSchema.index({ sectionId: 1, order: 1 }, { unique: true });

const Chapter = mongoose.models.Chapter || mongoose.model("Chapter", chapterSchema);

export default Chapter;
