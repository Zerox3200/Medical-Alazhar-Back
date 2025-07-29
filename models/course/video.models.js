import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: { type: String, required: [true, "Description is required"] },
    level: {
      type: String,
      required: [true, "Level is required"],
      enum: ["advanced", "intermediate", "entry"],
    },
    url: {
      type: String,
      unique: [true, "This video is already in use"],
      required: [true, "URL is required"],
    },
    duration: { type: String, required: [true, "Duration is required"] },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  },
  { timestamps: true }
);

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

export default Video;
