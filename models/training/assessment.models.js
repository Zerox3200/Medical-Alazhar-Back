import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
    },
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intern",
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
    },
    assessmentType: {
      type: String,
      required: [true, "Assessment type is required"],
    },
    assessmentDomains: [
      {
        question: { type: String, required: true },
        score: {
          type: String,
          enum: [
            "below_expectations",
            "meet_expectations",
            "above_expectations",
          ],
        },
      },
    ],
    isPassed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Assessment =
  mongoose.Model.Assessment || mongoose.model("assessment", assessmentSchema);

export default Assessment;
