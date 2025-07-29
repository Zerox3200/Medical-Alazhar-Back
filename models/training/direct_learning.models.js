import mongoose from "mongoose";

const directLearningSchema = new mongoose.Schema(
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
    topic: {
      type: String,
      required: [true, "Topic is required"],
    },
    date: { type: Date, default: Date.now() },
    state: {
      type: String,
      default: "under_review",
      enum: ["accepted", "rejected", "under_review"],
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor" },
  },
  { timestamps: true }
);

const DirectLearning =
  mongoose.Model.DirectLearning ||
  mongoose.model("directLearning", directLearningSchema);

export default DirectLearning;
