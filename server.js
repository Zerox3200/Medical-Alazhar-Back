import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import "dotenv/config";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import httpStatusText from "./utils/httpStatusText.js";
/*
 ************ Routes ************
 */

// Admin
import adminRoutes from "./routes/admin/admin.route.js";
// Supervisors
import supervisorRoutes from "./routes/supervisor/supervisor.route.js";
// Interns
import internRoutes from "./routes/intern/index.route.js";
// Course
import courseRoutes from "./routes/course/course.route.js";
// Auth route for login
import authRoutes from "./routes/auth.route.js";

const app = express();

// Define pathname and dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Body Parser
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

app.use(
  express.static("dist", {
    setHeaders: (res) => {
      res.set("Content-Type", "application/javascript");
    },
  })
);

// Serve static files
const uploadDir = path.join(__dirname, "uploads", "images");

app.use("/uploads/images", express.static(uploadDir));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Homepage Route
app.get("/", (req, res, next) => {
  res.status(200).json("homepage");
});

// End points
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/intern", internRoutes);
app.use("/api/v1/supervisor", supervisorRoutes);

// Unmatched Route
app.all("*", (req, res, next) => {
  return res
    .status(404)
    .json({ status: httpStatusText.FAIL, message: "Invalid Resource" });
});

// Error Handling
app.use((error, req, res, next) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      error: `${field} already exists`,
    });
  }
  console.log(error);
  res
    .status(error.statusCode || 500)
    .json({ status: httpStatusText.ERROR, message: error.message });
});

// Connect to db and start server
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    });

    console.log("✅ MongoDB connected successfully");
    return connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("Server closed");
        mongoose.connection.close(false, () => {
          console.log("MongoDB connection closed");
          process.exit(0);
        });
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received. Shutting down gracefully...");
      server.close(() => {
        console.log("Server closed");
        mongoose.connection.close(false, () => {
          console.log("MongoDB connection closed");
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
