import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    questions: [
      {
        questionText: String,
        options: [String],
        correctAnswer: String,
      },
    ],
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  },
  { timestamps: true }
);

const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);

export default Quiz;
