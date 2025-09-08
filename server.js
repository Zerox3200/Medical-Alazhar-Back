import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import { appRouter } from "./app.router.js";

const app = express();

// Initialize app router with all routes and middleware
appRouter(app, express);

// Connect to db and start server
const connectDB = async () => {
  try {
    const connection = await mongoose.connect("mongodb+srv://ahmedjootravel:8rVMVqHfCo5G5bRp@cluster0.ghntmgs.mongodb.net/mims", {
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

    const server = app.listen(3000, () => {
      console.log(`🚀 Server running on port ${3000}`);
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
