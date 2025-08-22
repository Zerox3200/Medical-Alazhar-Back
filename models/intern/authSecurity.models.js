const authAndSecurity = {
  password: {
    type: String,
    required: [true, "Password is required."],
  },
  approved: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: () => new Date(),
  },
  passwordResetToken: {
    type: String,
  },
  role: {
    type: String,
    default: "intern",
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  accountStatus: {
    type: String,
    enum: ["active", "suspended", "deactivated"],
    default: "active",
  },
};

export default authAndSecurity;
