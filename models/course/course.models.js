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
  courseBanner: { type: String },
  mentor: { type: String, required: [true, "Mentor is required"] },
  tags: [{ type: String, required: [true, "Add at least one tag"] }],
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
  certificateTemplate: String,
  published: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  NormalUserSubscriptions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      subscriptionDate: { type: Date, default: Date.now },
    }
  ],
  InternSubscriptions: [
    {
      internId: { type: mongoose.Schema.Types.ObjectId, ref: "Intern" },
      subscriptionDate: { type: Date, default: Date.now },
    }
  ],
  supervisorSubscriptions: [
    {
      supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor" },
      subscriptionDate: { type: Date, default: Date.now },
    }
  ],
});

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;