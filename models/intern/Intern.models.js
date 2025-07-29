import mongoose from "mongoose";
import authAndSecurity from "./authSecurity.models.js";
import internInfo from "./internInfo.models.js";
import validateUniqueEmailAndPhone from "../common.model.js";

const Schema = mongoose.Schema;

const internSchema = new Schema(
  {
    // General Information
    fullname: {
      type: String,
      required: [true, "English name is required."],
      trim: true,
    },
    arabicName: {
      type: String,
      required: [true, "Arabic name is required."],
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

    // Intern Information
    ...internInfo,

    // Authentication and security
    ...authAndSecurity,
  },
  { timestamps: true, strict: true }
);

internSchema.index({ email: 1, phone: 1 }, { unique: true });
internSchema.pre("save", async function (next) {
  try {
    await validateUniqueEmailAndPhone(this.email, this.phone, this.constructor);
    next();
  } catch (error) {
    next(error);
  }
});

const Intern = mongoose.models.Intern || mongoose.model("Intern", internSchema);

export default Intern;
