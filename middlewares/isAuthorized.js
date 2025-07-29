import httpStatusText from "../utils/httpStatusText.js";
import mongoose from "mongoose";
import _ from "lodash";

const isAuthorized = (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      status: httpStatusText.UNAUTHORIZED,
      code: 401,
      message: "UNAUTHORIZED: No user authenticated.",
    });
  }
  const userIdFromToken = req.user._id.toString();
  const { userId, userRole } = req.query;

  if (!userId) {
    return res.status(400).json({
      status: httpStatusText.UNAUTHORIZED,
      code: 400,
      message: "BAD_REQUEST: User ID is required in request query.",
    });
  }

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      status: httpStatusText.BAD_REQUEST,
      code: 400,
      message: "BAD_REQUEST: Invalid user ID format.",
    });
  }

  const allowedRoles = ["admin", "supervisor", "coordinator", "intern"];
  if (!_.includes(allowedRoles, userRole)) {
    return res.status(403).json({
      status: httpStatusText.FORBIDDEN,
      code: 403,
      message: "FORBIDDEN: You are not authorized to perform this action.",
    });
  }

  if (userId !== userIdFromToken) {
    console.warn(
      `Unauthorized access attempt by user ${userIdFromToken} for user ${userId}`
    );
    return res.status(403).json({
      status: httpStatusText.FORBIDDEN,
      code: 403,
      message: "FORBIDDEN: You are not authorized to perform this action.",
    });
  }

  next();
};

export default isAuthorized;
