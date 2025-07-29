import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import Procedure from "../../../models/training/procedure.model.js";
import httpStatusText from "../../../utils/httpStatusText.js";
import checkIdValidity from "../../../utils/checkIdValidity.js";
import Intern from "../../../models/intern/Intern.models.js";

// Fetch all procedures
export const getAllProcedures = asyncWrapper(async (req, res, next) => {
  // Filter cases
  const filters = { internId: req.user._id };

  if (req.query.searchTerm) {
    filters.$or = [
      { skill: { $regex: req.query.searchTerm, $options: "i" } },
      { venue: { $regex: req.query.searchTerm, $options: "i" } },
      { state: { $regex: req.query.searchTerm, $options: "i" } },
    ];
  }
  if (req.query.roundId) filters.roundId = req.query.roundId;
  if (req.query.venue) filters.venue = req.query.venue;
  if (req.query.state) filters.state = req.query.state;
  if (req.query.dateFrom || req.query.dateTo) {
    filters.date = {};
    if (req.query.dateFrom) filters.date.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) filters.date.$lte = new Date(req.query.dateTo);
  }

  const limit = req.query.limit || 5;
  const page = req.query.page || 1;
  const skip = (page - 1) * limit;

  const procedures = await Procedure.find(filters)
    .populate("roundId internId", "name fullname")
    .limit(limit)
    .skip(skip)
    .select("-__v")
    .exec();

  if (!procedures)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Failed fetching procedures.",
    });

  return res.status(200).json({
    count: procedures?.length,
    data: procedures,
    message: "Procedures fetched.",
  });
});

// Fetch single procedure
export const getSingleProcedure = asyncWrapper(async (req, res, next) => {
  const { procedureId } = req.params;
  checkIdValidity(procedureId, res, req.user._id);

  const singleProcedure = await Procedure.findOne({
    _id: procedureId,
    internId: req.user._id,
  })
    .populate("roundId reviewedBy", "name fullname")
    .select("-__V")
    .lean();

  if (!singleProcedure)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Skill not found",
    });

  return res
    .status(200)
    .json({ code: 200, data: singleProcedure, message: "Skill fetched." });
});

// Add new procedure
export const addProcedure = asyncWrapper(async (req, res, next) => {
  const { roundId, ...procedureData } = req.body;

  checkIdValidity(roundId, res);

  const newProcedure = new Procedure({
    internId: req.user._id,
    roundId,
    state: "under_review",
    ...procedureData,
  });

  await newProcedure.save();

  if (!newProcedure)
    return res.status(400).json({ message: "Failed adding new skill" });

  const updateResult = await Intern.updateOne(
    {
      _id: req.user._id,
      "trainingProgress.roundId": roundId,
    },
    {
      $addToSet: {
        "trainingProgress.$.procedures": newProcedure._id,
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
            procedures: [newProcedure._id],
            cases: [],
            selfLearning: [],
            directLearning: [],
          },
        },
      }
    );
  }

  return res
    .status(201)
    .json({ code: 201, data: newProcedure, message: "New skill added" });
});

// Edit Procedure
export const editProcedure = asyncWrapper(async (req, res, next) => {
  const { procedureId } = req.params;
  const { editMode } = req.query;
  const {
    roundId,
    patientGender,
    skill,
    hospitalRecord,
    venue,
    performanceLevel,
  } = req.body;
  checkIdValidity(procedureId, res);

  if (!editMode || editMode !== "true") {
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Edit mode not enabled",
    });
  }

  const singleProcedure = await Procedure.findOne({
    _id: procedureId,
    internId: req.user._id,
  })
    .populate("roundId", "name")
    .lean();

  if (!singleProcedure)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Procedure not found",
    });

  if (singleProcedure.state === "accepted")
    return res.status(403).json({
      code: 403,
      status: httpStatusText.FAIL,
      message: "This procedure is accpeted and can't be edit",
    });

  const updatedProcedure = await Procedure.updateOne(
    { _id: procedureId, internId: req.user._id },
    {
      roundId,
      patientGender,
      hospitalRecord,
      venue,
      skill,
      performanceLevel,
    },
    { new: true }
  );

  if (!updatedProcedure)
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Error updating procedure, try again later",
    });

  return res
    .status(200)
    .json({ code: 200, data: updatedProcedure, message: "Procedure updated." });
});

// Delete Procedure
export const deleteProcedure = asyncWrapper(async (req, res, next) => {
  const { procedureId } = req.params;
  checkIdValidity(procedureId, res, req.user._id);

  const procedure = await Procedure.findOne({
    _id: procedureId,
    internId: req.user._id,
  });

  if (!procedure)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Procedure not found",
    });

  if (procedure.state === "accepted")
    return res.status(403).json({
      code: 403,
      status: httpStatusText.FAIL,
      message: "Accepted procedure can't be deleted",
    });

  const deletedProcedure = await Procedure.findByIdAndDelete(procedureId);
  if (!deletedProcedure)
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Failed to delete procedure",
    });

  const updateResult = await Intern.updateOne(
    {
      _id: req.user._id,
      "trainingProgress.roundId": procedure.roundId,
    },
    {
      $pull: {
        "trainingProgress.$.procedures": procedureId,
      },
    },
    { new: true }
  );

  if (updateResult.modifiedCount === 0)
    throw new Error("ERROR: failed updating ypur progress");

  return res.status(200).json({ code: 200, message: "Procedure deleted." });
});
