import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  courseImage: { type: String, required: [true, "Course image is required"] },
  mentor: { type: String, required: [true, "Mentor is required"] },
  tags: [{ type: String, required: [true, "Add at least one tag"] }],
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
  certificateTemplate: String,
});

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;
