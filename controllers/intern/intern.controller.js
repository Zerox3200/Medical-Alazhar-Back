import checkIdValidity from "../../utils/checkIdValidity.js";
import Intern from "../../models/intern/Intern.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import { imageUploader } from "../uploads/uploader.controller.js";
import _ from "lodash";

// Get Intern Data
export const getIntern = asyncWrapper(async (req, res, next) => {
  const { internId } = req.params;
  checkIdValidity(internId, res);

  const intern = await Intern.findById(internId)
    .select(["-__v", "-password", "-createdAt", "-loginAttempts", "-isLocked"])
    .populate("trainingProgress.roundId", "name")
    .populate({
      path: "trainingProgress.cases",
      select: "state",
    })
    .populate({ path: "trainingProgress.procedures", select: "state" })
    .populate({ path: "trainingProgress.selfLearning", select: "state" })
    .populate({ path: "trainingProgress.directLearning", select: "state" })
    .populate({ path: "trainingProgress.assessments", select: "isPassed" })
    .populate({ path: "currentRound.roundId", select: "name" })
    .lean();

  if (!intern)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Not found",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    data: intern,
  });
});

// Set Intern Profile Image
export const profileImage = asyncWrapper(async (req, res, next) => {
  const { internId } = req.params;
  checkIdValidity(internId, res);
  await imageUploader(req, res, next, Intern, internId);
});
