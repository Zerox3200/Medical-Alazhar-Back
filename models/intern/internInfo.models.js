import mongoose from "mongoose";

const internInfo = {
  dob: {
    type: Date,
    required: [true, "Date of birth is required"],
  },
  cummulativeTotal: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, "Cummulative total is required."],
  },
  internshipStartDate: {
    type: Date,
    required: [true, "Internship start date is required"],
  },
  internLevel: {
    type: String,
    enum: ["mi_1", "mi_2"],
    required: [true, "Level is required."],
  },
  nationality: {
    type: String,
    required: [true, "Nationality is required."],
  },
  facultyOfGraduation: {
    type: String,
    required: [true, "Faculty is required."],
  },
  yearOfGraduation: {
    type: String,
    required: [true, "Year of Graduation is required."],
  },
  idOrPassport: {
    type: { type: String, enum: ["nationalID", "passport"], required: true },
    number: { type: String, required: true },
  },
  facultyIDNumber: {
    type: Number,
    required: [true, "Faculty ID Number is required."],
  },
  grade: {
    type: String,
    required: [true, "Grade is required."],
  },
  orderOfGraduate: {
    type: Number,
    required: [true, "Order of graduate is required."],
  },
  hospital: {
    type: String,
    enum: ["al_hussein", "sayed_galal"],
    required: [true, "Hospital is required"],
  },

  profileImage: { type: String },
  nationalIDImage: { type: String },
  mbbchCertificateImage: { type: String },

  // Rounds
  currentRound: {
    roundId: { type: mongoose.Schema.Types.ObjectId, ref: "Round" },
    waveId: { type: mongoose.Schema.Types.ObjectId },
    supervisor: { type: mongoose.Schema.Types.ObjectId },
    completed: { type: Boolean, default: false },
  },
  // attendedRounds: [
  //   {
  //     roundId: { type: mongoose.Schema.Types.ObjectId, ref: "Round" },
  //     waveId: mongoose.Schema.Types.ObjectId,
  //     supervisor: { type: mongoose.Schema.Types.ObjectId },
  //     completed: { type: Boolean, default: false },
  //   },
  // ],
  // Courses progress
  coursesProgress: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date, default: Date.now },
      videos: [
        {
          videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
          isCompleted: { type: Boolean, default: false },
          completedAt: Date,
        },
      ],
      quizzes: {
        passed: [
          {
            quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
            isCompleted: { type: Boolean, default: false },
            score: { type: Number, default: 0, min: 0 },
            completedAt: { type: Date, default: Date.now },
          },
        ],
        failed: [
          {
            quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
            attempts: { type: Number, default: 0, min: 0 },
            isLocked: { type: Boolean, default: false },
            lockedUntil: { type: Date },
          },
        ],
      },
    },
  ],
  // Training progress
  trainingProgress: [
    {
      _id: false,
      roundId: { type: mongoose.Schema.Types.ObjectId, ref: "Round" },
      supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor" },
      waveId: { type: mongoose.Schema.Types.ObjectId },
      completed: { type: Boolean, default: false },
      assessments: [
        {
          _id: false,
          type: mongoose.Schema.Types.ObjectId,
          ref: "assessment",
        },
      ],
      cases: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "case",
        },
      ],
      procedures: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "procedure",
        },
      ],
      selfLearning: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "selfLearning",
        },
      ],
      directLearning: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "directLearning",
        },
      ],
    },
  ],
};

export default internInfo;
