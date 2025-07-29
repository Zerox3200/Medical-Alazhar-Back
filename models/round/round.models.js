import mongoose from "mongoose";

const roundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Round name is required"],
    },
    numericYear: {
      type: Number,
      enum: [1, 2],
      required: [true, "Year is required"],
    },
    supervisors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supervisor",
        default: [],
      },
    ],
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
      default: null,
    },
    hospital: {
      type: String,
      enum: ["al_hussein", "sayed_galal"],
      required: [true, "Hospital is required"],
    },
    duration: {
      type: Number,
      enum: [1, 2, 3],
      required: [true, "Duration is required"],
    },
    waves: [
      {
        waveOrder: {
          type: Number,
          unique: [true, "Order is unique"],
          required: [true, "Order is required"],
        },
        startDate: {
          type: Date,
          default: new Date(),
        },
        endDate: {
          type: Date,
          default: new Date(),
        },
        interns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Intern" }],
        waveStatus: {
          type: String,
          default: "ongoing",
          enum: ["completed", "ongoing"],
        },
      },
    ],
    requirements: {
      minCases: { type: Number, min: 20 },
      minProcedures: { type: Number, min: 20 },
      minSelfLearnedActivities: { type: Number, min: 10 },
      minDirectLearnedActivities: { type: Number, min: 10 },
      minAssessments: { type: Number, min: 1 },
    },
  },
  { timestamps: true }
);

roundSchema.pre("save", async function (next) {
  try {
    if (this.supervisors.length >= 4)
      throw new Error("Maximum number of supervisors");
  } catch (error) {
    next(error);
  }
});

const Round = mongoose.models.Rounds || mongoose.model("Round", roundSchema);

export default Round;
