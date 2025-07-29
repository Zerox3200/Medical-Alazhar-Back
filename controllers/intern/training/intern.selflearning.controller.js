import fs from "fs";
import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import SelfLearning from "../../../models/training/self_learning.models.js";
import httpStatusText from "../../../utils/httpStatusText.js";
import checkIdValidity from "../../../utils/checkIdValidity.js";
import Intern from "../../../models/intern/Intern.models.js";

// Fetch all self learning activitiy
export const getAllSelfLearningActivities = asyncWrapper(
  async (req, res, next) => {
    // Filter activities
    const filters = { internId: req.user._id };

    if (req.query.searchTerm) {
      filters.$or = [
        { learnedActivity: { $regex: req.query.searchTerm, $options: "i" } },
        { activityTitle: { $regex: req.query.searchTerm, $options: "i" } },
      ];
    }
    if (req.query.roundId) filters.roundId = req.query.roundId;
    if (req.query.state) filters.state = req.query.state;
    if (req.query.dateFrom || req.query.dateTo) {
      filters.date = {};
      if (req.query.dateFrom) filters.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filters.date.$lte = new Date(req.query.dateTo);
    }

    const limit = req.query.limit || 5;
    const page = req.query.page || 1;
    const skip = (page - 1) * limit;

    const activities = await SelfLearning.find(filters)
      .populate("roundId", "name")
      .limit(limit)
      .skip(skip)
      .select("-__v")
      .exec();

    if (!activities) {
      return res.status(404).json({
        code: 404,
        status: httpStatusText.ERROR,
        message: "Failed fetching activities",
      });
    }
    return res.status(200).json({
      count: activities.length,
      data: activities,
      message: "All activities fetched.",
    });
  }
);

// Fetch single self learning activitiy
export const getSingleSelfLearningActivity = asyncWrapper(
  async (req, res, next) => {
    const { activityId } = req.params;
    checkIdValidity(activityId, res, req.user._id);

    const activity = await SelfLearning.findOne({
      _id: activityId,
      internId: req.user._id,
    })
      .populate("roundId reviewedBy", "name fullname")
      .select("-__v")
      .lean();

    if (!activity)
      return res.status(404).json({
        code: 404,
        status: httpStatusText.ERROR,
        message: "Activity not found",
      });

    return res
      .status(200)
      .json({ code: 200, data: activity, message: "Activity fetched." });
  }
);

// Add new self learning activitiy
export const addSelfLearningActivity = asyncWrapper(async (req, res, next) => {
  const { roundId, ...activityData } = req.body;

  checkIdValidity(roundId, res);
  const selfLearningActivityEvidence = req.file?.path.replace(/\\/g, "/");

  if (!selfLearningActivityEvidence)
    return res.status(400).json({
      status: httpStatusText.FAIL,
      code: 400,
      message: "Evidence image is required",
    });

  const newActivity = new SelfLearning({
    internId: req.user._id,
    roundId,
    activitiyState: "under_review",
    selfLearningActivityEvidence,
    ...activityData,
  });
  await newActivity.save();
  if (!newActivity)
    return res.status(400).json({ message: "Failed adding new activity" });

  const updateResult = await Intern.updateOne(
    {
      _id: req.user._id,
      "trainingProgress.roundId": roundId,
    },
    {
      $addToSet: {
        "trainingProgress.$.selfLearning": newActivity._id,
      },
    }
  );

  if (updateResult.matchedCount !== 1) {
    await Intern.updateOne(
      {
        _id: req.user._id,
      },
      {
        $push: {
          trainingProgress: {
            roundId,
            cases: [],
            procedures: [],
            selfLearning: [newActivity._id],
            directLearning: [],
          },
        },
      }
    );
  }

  return res
    .status(201)
    .json({ code: 201, data: newActivity, message: "New activity added" });
});

// Edit self learning activitiy
export const editSelfLearningActivity = asyncWrapper(async (req, res, next) => {
  const { activityId } = req.params;
  const { editMode } = req.query;
  const { roundId, learnedActivity, activityTitle, date } = req.body;
  checkIdValidity(activityId, res);

  if (!editMode || editMode !== "true") {
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Edit mode not enabled",
    });
  }

  const activity = await SelfLearning.findOne({
    _id: activityId,
    internId: req.user._id,
  })
    .populate("roundId", "name")
    .lean();

  if (!activity)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Activitiy not found",
    });

  if (activity.state === "accepted")
    return res.status(403).json({
      code: 403,
      status: httpStatusText.FAIL,
      message: "This activity is accpeted and can't be edit",
    });

  const hasChanges =
    roundId !== activity.roundId.toString() ||
    learnedActivity !== activity.learnedActivity ||
    activityTitle !== activity.activityTitle ||
    new Date(date).getTime() !== activity.date.getTime();

  if (!hasChanges && req.file) {
    await fs.promises.rm(req.file.path, { force: true });
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "No changes detected besides file upload",
    });
  }

  let evidencePath = activity.selfLearningActivityEvidence;
  if (req.file) {
    try {
      if (evidencePath) {
        await fs.promises.rm(evidencePath, {
          force: true,
          maxRetries: 3,
          retryDelay: 100,
        });
      }

      evidencePath = req.file.path.replaceAll("\\", "/");
    } catch (error) {
      await fs.promises.rm(req.file.path, { force: true });
      return res.status(500).json({
        code: 500,
        status: httpStatusText.ERROR,
        message: "Error processing file upload",
        error: error.message,
      });
    }
  }

  const updatedActivity = await SelfLearning.findOneAndUpdate(
    { _id: activityId, internId: req.user._id },
    {
      internId: req.user._id,
      roundId,
      learnedActivity,
      activityTitle,
      date,
      selfLearningActivityEvidence: evidencePath,
      state: "under_review",
    },
    { new: true }
  );

  if (!updatedActivity)
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Error updating activity, try again later",
    });

  return res.status(200).json({
    code: 200,
    data: updatedActivity,
    message: "Activity updated.",
  });
});

// Delete self learning activitiy
export const deleteSelfLearningActivity = asyncWrapper(
  async (req, res, next) => {
    const { activityId } = req.params;
    checkIdValidity(activityId, res, req.user._id);

    const activity = await SelfLearning.findOne({
      _id: activityId,
      internId: req.user._id,
    });

    if (!activity)
      return res.status(404).json({
        code: 404,
        status: httpStatusText.FAIL,
        message: "Activity not found",
      });

    if (activity.state === "accepted")
      return res.status(403).json({
        code: 403,
        status: httpStatusText.FAIL,
        message: "Accepted activity can't be deleted",
      });

    const deletedActivity = await SelfLearning.findByIdAndDelete(activityId);
    if (!deletedActivity)
      return res.status(400).json({
        code: 400,
        status: httpStatusText.ERROR,
        message: "Error deleting the activity",
      });
    try {
      await fs.promises.rm(activity.selfLearningActivityEvidence, {
        force: true,
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        status: httpStatusText.ERROR,
        message: "Error processing file upload",
        error: error.message,
      });
    }

    const updateResult = await Intern.updateOne(
      {
        _id: req.user._id,
        "trainingProgress.roundId": activity.roundId,
      },
      {
        $pull: {
          "trainingProgress.$.selfLearning": activityId,
        },
      },
      { new: true }
    );

    if (updateResult.modifiedCount === 0)
      throw new Error("ERROR: failed updating ypur progress");

    return res.status(200).json({ code: 200, message: "Activity deleted." });
  }
);
