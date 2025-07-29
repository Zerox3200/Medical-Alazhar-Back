import mongoose from "mongoose";
import validateUniqueEmailAndPhone from "../common.model.js";

const adminSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: "admin",
      default: "admin",
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    verified: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
    },
    speciality: { type: String, required: false },
    profileImage: { type: String },
    lastLogin: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

adminSchema.index({ email: 1, phone: 1 }, { unique: true });
adminSchema.pre("save", async function (next) {
  try {
    await validateUniqueEmailAndPhone(this.email, this.phone, this.constructor);
    next();
  } catch (error) {
    next(error);
  }
});

const Admin = mongoose.models.Admins || mongoose.model("Admin", adminSchema);

export default Admin;
