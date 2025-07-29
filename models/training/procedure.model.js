import mongoose from "mongoose";

const procedureSchema = new mongoose.Schema(
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
    skill: {
      type: String,
      required: [true, "Skill is required"],
    },
    hospitalRecord: {
      type: Number,
      required: [true, "Hospital record is required"],
    },
    performanceLevel: {
      type: String,
      required: [true, "Performance level is required"],
    },
    venue: { type: String, required: [true, "Venue is required"] },
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

const Procedure =
  mongoose.Model.Procedure || mongoose.model("procedure", procedureSchema);

export default Procedure;
