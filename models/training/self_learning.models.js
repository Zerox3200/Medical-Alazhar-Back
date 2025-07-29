import mongoose from "mongoose";

const selfLearningSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: [true, "Select your round please"],
    },
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intern",
      required: true,
    },
    learnedActivity: {
      type: String,
      required: [true, "Activity is required"],
    },
    activityTitle: {
      type: String,
      required: [true, "Title is required"],
    },
    date: { type: Date, default: Date.now() },
    selfLearningActivityEvidence: {
      type: String,
      required: [true, "Please provide an image of your certificate"],
    },
    state: {
      type: String,
      default: "under_review",
      enum: ["accepted", "rejected", "under_review"],
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor" },
  },
  { timestamps: true }
);

const SelfLearning =
  mongoose.Model.SelfLearning ||
  mongoose.model("selfLearning", selfLearningSchema);

export default SelfLearning;
