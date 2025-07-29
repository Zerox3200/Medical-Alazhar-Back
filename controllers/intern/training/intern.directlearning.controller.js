import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import Intern from "../../../models/intern/Intern.models.js";
import DirectLearning from "../../../models/training/direct_learning.models.js";
import httpStatusText from "../../../utils/httpStatusText.js";
import checkIdValidity from "../../../utils/checkIdValidity.js";

// Fetch all direct learning activitiy
export const getAllDirectLearningActivities = asyncWrapper(
  async (req, res, next) => {
    // Filter cases
    const filters = { internId: req.user._id };

    if (req.query.searchTerm) {
      filters.$or = [
        { learnedActivity: { $regex: req.query.searchTerm, $options: "i" } },
        { topic: { $regex: req.query.searchTerm, $options: "i" } },
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

    const activities = await DirectLearning.find(filters)
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

// Fetch single direct learning activitiy
export const getSingleDirectLearningActivity = asyncWrapper(
  async (req, res, next) => {
    const { activityId } = req.params;
    checkIdValidity(activityId, res, req.user._id);

    const activitiy = await DirectLearning.findOne({
      _id: activityId,
      internId: req.user._id,
    })
      .populate("roundId reviewedBy", "name fullname")
      .select("-__v")
      .lean();

    if (!activitiy)
      return res.status(404).json({
        code: 404,
        status: httpStatusText.ERROR,
        message: "Activitiy not found",
      });

    return res
      .status(200)
      .json({ code: 200, data: activitiy, message: "Activitiy fetched." });
  }
);

// Add new direct learning activitiy
export const addDirectLearningActivity = asyncWrapper(
  async (req, res, next) => {
    const { roundId, ...activityData } = req.body;
    checkIdValidity(roundId, res);

    const newActivity = new DirectLearning({
      roundId,
      internId: req.user._id,
      activitiyState: "under_review",
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
          "trainingProgress.$.directLearning": newActivity._id,
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
              selfLearning: [],
              directLearning: [newActivity._id],
            },
          },
        }
      );
    }

    return res
      .status(201)
      .json({ code: 201, data: newActivity, message: "New activity added" });
  }
);

// Edit direct learning activitiy
export const editDirectLearningActivity = asyncWrapper(
  async (req, res, next) => {
    const { activityId } = req.params;
    const { editMode } = req.query;
    const { roundId, learnedActivity, topic, date } = req.body;
    checkIdValidity(activityId, res);

    if (!editMode || editMode !== "true") {
      return res.status(400).json({
        code: 400,
        status: httpStatusText.ERROR,
        message: "Edit mode not enabled",
      });
    }

    const activity = await DirectLearning.findOne({
      _id: activityId,
      internId: req.user._id,
    })
      .populate("roundId", "name")
      .lean();

    if (!activity)
      return res.status(404).json({
        code: 404,
        status: httpStatusText.ERROR,
        message: "Activity not found",
      });

    if (activity.state === "accepted")
      return res.status(403).json({
        code: 403,
        status: httpStatusText.FAIL,
        message: "This activity is accpeted and can't be edit",
      });

    const updatedActivity = await DirectLearning.findOneAndUpdate(
      { _id: activityId, internId: req.user._id },
      {
        roundId,
        learnedActivity,
        topic,
        date,
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
  }
);

// Delete direct learning activitiy
export const deleteDirectLearningActivity = asyncWrapper(
  async (req, res, next) => {
    const { activityId } = req.params;
    checkIdValidity(activityId, res, req.user._id);

    const activity = await DirectLearning.findOne({
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

    const deletedActivity = await DirectLearning.findByIdAndDelete(activityId);

    if (!deletedActivity)
      return res.status(400).json({
        code: 400,
        status: httpStatusText.ERROR,
        message: "Error deleting the activitiy",
      });
    const updateResult = await Intern.updateOne(
      {
        _id: req.user._id,
        "trainingProgress.roundId": activity.roundId,
      },
      {
        $pull: {
          "trainingProgress.$.directLearning": activityId,
        },
      },
      { new: true }
    );

    if (updateResult.modifiedCount === 0)
      throw new Error("ERROR: failed updating ypur progress");
    return res.status(200).json({ code: 200, message: "Activitiy deleted." });
  }
);
