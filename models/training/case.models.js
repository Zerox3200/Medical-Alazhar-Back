import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
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
    patientGender: {
      type: String,
      required: [true, "Patient gender is required"],
    },
    patientSerial: {
      type: String,
      required: [true, "Patient serial is required"],
    },
    patientAge: {
      type: Number,
      required: [true, "Patient age is required"],
    },
    venue: { type: String, required: [true, "Venue is required"] },
    date: { type: Date, default: Date.now() },
    caseType: { type: String, required: false },
    epas: [
      {
        type: String,
        required: [true, "Relevant descriptors (EPAs) is required"],
      },
    ],
    expectedLevel: {
      type: String,
      required: [true, "Expected Level is required"],
    },
    caseSummary: {
      type: String,
      required: [true, "Summary is required"],
    },
    selfReflection: {
      type: String,
      required: [true, "Self reflection is required"],
    },
    minimalFrequency: {
      type: Number,
      default: 20,
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

const Case = mongoose.Model.Case || mongoose.model("case", caseSchema);

export default Case;
