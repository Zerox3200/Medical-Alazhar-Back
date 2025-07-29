import { isValidObjectId } from "mongoose";
import Intern from "../models/intern/Intern.models.js";
import Supervisor from "../models/supervisor/supervisor.models.js";
import asyncWrapper from "../middlewares/asyncWrapper.js";
import httpStatusText from "../utils/httpStatusText.js";

// Handle get user common logic
const handleGetUser = async (userId, model, res) => {
  const user = await model
    .findById(userId)
    .select(["-__v", "-password", "-createdAt", "-loginAttempts"]);

  if (!user)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "User not found",
    });

  if (!user.approved)
    return res.status(403).json({
      status: httpStatusText.FORBIDDEN,
      code: 403,
      message: "Your account is not approved yet",
    });

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, code: 200, user });
};

// Get Intern
export const getIntern = asyncWrapper(async (req, res, next) => {
  const { internId } = req.params;

  if (!isValidObjectId(internId))
    return res.status(400).json({
      status: httpStatusText.ERROR,
      code: 400,
      message: "Invalid Object ID",
    });

  return handleGetUser(internId, Intern, res);
});
