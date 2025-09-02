import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Section title is required"],
    },
    description: {
        type: String,
        required: [true, "Section description is required"],
    },
    order: {
        type: Number,
        required: [true, "Section order is required"],
        min: 1,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course ID is required"],
    },
    chapters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapter",
    }],
    isPublished: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });


const Section = mongoose.models.Section || mongoose.model("Section", sectionSchema);

export default Section;
