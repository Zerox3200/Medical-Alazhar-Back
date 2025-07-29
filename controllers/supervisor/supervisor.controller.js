import { isValidObjectId } from "mongoose";
import Intern from "../../models/intern/Intern.models.js";
import Supervisor from "../../models/supervisor/supervisor.models.js";
import Round from "../../models/round/round.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import { imageUploader } from "../uploads/uploader.controller.js";
import checkIdValidity from "../../utils/checkIdValidity.js";

// Get Supervisor
export const getSupervisor = asyncWrapper(async (req, res, next) => {
  const { supervisorId } = req.params;
  checkIdValidity(supervisorId, res);

  const supervisor = await Supervisor.findById(supervisorId, {
    isLocked: 0,
    accountStatus: 0,
    password: 0,
    __v: 0,
    loginAttempts: 0,
    createdAt: 0,
  }).populate("round", "name");

  if (!supervisor)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Supervisor not found",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    data: supervisor,
  });
});

// Assign Intern To Supervisor
export const assignInternToSupervisor = asyncWrapper(async (req, res, next) => {
  const { roundId, coordinatorId } = req.params;
  const { internId, supervisorId } = req.body;

  checkIdValidity(coordinatorId, res, internId);

  //  Check if this intern exists in the round
  const [intern, coordinator, supervisor, round] = await Promise.all([
    Intern.findById(internId, { currentRound: 1 }),
    Supervisor.findById(coordinatorId, { round: 1 }),
    Supervisor.findById(supervisorId, { round: 1 }),
    Round.findById(roundId, { coordinator: 1, supervisor: 1, waves: 1 }),
  ]);
  if (
    !intern ||
    intern.currentRound?.roundId?.toString() !== round?._id.toString()
  ) {
    return res.status(400).json({
      status: httpStatusText.ERROR,
      code: 400,
      message: "This intern is not listed in this round",
    });
  }

  if (!coordinator || !supervisor || !round)
    return res.status(400).json({
      status: httpStatusText.ERROR,
      code: 400,
      message: "Round not found or relationships don't match",
    });

  // Check if the supervisor doesn't have any intern
  const exists = await Supervisor.findOne({
    _id: supervisorId,
    "assignedInterns.internId": internId,
  });

  // I used update many here to enable adding multiple interns at once
  let updatedSupervisor;
  if (!exists) {
    updatedSupervisor = await Supervisor.updateMany(
      { _id: supervisorId },
      { $addToSet: { assignedInterns: { internId, waveId: intern.waveId } } },
      { upsert: true }
    );
  }

  if (updatedSupervisor?.modifiedCount !== 0) {
    await Intern.updateMany(
      { _id: internId, "currentRound.roundId": roundId },
      { $set: { "currentRound.supervisor": supervisorId } },
      { upsert: true }
    );
  }

  await Intern.updateOne(
    {
      _id: intern,
      "trainingProgress.roundId": roundId,
    },
    {
      $set: {
        "trainingProgress.$.supervisorId": supervisorId,
      },
    }
  );

  return res.status(200).json({
    code: 200,
    status: httpStatusText.SUCCESS,
    message: "New intern(s) assigned.",
  });
});

// Set Supervisor Profile Image
export const profileImage = asyncWrapper(async (req, res, next) => {
  const { supervisorId } = req.params;
  if (!isValidObjectId(supervisorId))
    return res.status(400).json({
      status: httpStatusText.ERROR,
      code: 400,
      message: "Invalid Object ID",
    });
  await imageUploader(req, res, next, Supervisor, supervisorId);
});
