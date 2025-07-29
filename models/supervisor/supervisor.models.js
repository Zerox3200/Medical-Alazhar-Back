import mongoose from "mongoose";
import validateUniqueEmailAndPhone from "../common.model.js";

const Schema = mongoose.Schema;

const supervisorSchema = new Schema(
  {
    fullname: {
      type: String,
      required: [true, "Fullname is required."],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Email is required."],
      unique: [true, "Email alreay in use"],
      lowercase: true,
    },
    phone: {
      type: Number,
      trim: true,
      required: [true, "Phone is required."],
      unique: [true, "Phone alreay in use"],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    lastLogin: {
      type: Date,
      default: () => new Date(),
    },
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
    },
    assignedInterns: [
      {
        internId: { type: mongoose.Schema.Types.ObjectId, ref: "Intern" },
        waveId: { type: mongoose.Schema.Types.ObjectId },
        assignmentDate: { type: Date, default: Date.now },
      },
    ],

    role: {
      type: String,
      enum: ["supervisor", "coordinator"],
      default: "supervisor",
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    approved: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    hospital: {
      type: String,
      enum: ["al_hussein", "sayed_galal"],
      required: [true, "Hospital is required"],
    },
    speciality: { type: String, required: [true, "Speciality is required"] },
    profileImage: { type: String },
  },
  { timestamps: true }
);

supervisorSchema.index({ email: 1, phone: 1 }, { unique: true });
supervisorSchema.pre("save", async function (next) {
  try {
    await validateUniqueEmailAndPhone(this.email, this.phone, this.constructor);
    next();
  } catch (error) {
    next(error);
  }
});

const Supervisor =
  mongoose.models.Supervisors || mongoose.model("Supervisor", supervisorSchema);

export default Supervisor;
