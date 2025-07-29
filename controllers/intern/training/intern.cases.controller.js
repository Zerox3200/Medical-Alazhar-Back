import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import Case from "../../../models/training/case.models.js";
import Intern from "../../../models/intern/Intern.models.js";
import httpStatusText from "../../../utils/httpStatusText.js";
import checkIdValidity from "../../../utils/checkIdValidity.js";

// Fetch all cases
export const getAllCases = asyncWrapper(async (req, res, next) => {
  if (req.query.roundId) checkIdValidity(roundId, res);

  // Filter cases
  const filters = { internId: req.user._id };

  if (req.query.searchTerm) {
    filters.$or = [
      { caseType: { $regex: req.query.searchTerm, $options: "i" } },
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

  const cases = await Case.find(filters)
    .populate("roundId internId", "name fullname")
    .limit(limit)
    .skip(skip)
    .select("-__v")
    .exec();

  if (!cases)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Failed fetching cases.",
    });

  return res
    .status(200)
    .json({ count: cases.length, cases, status: httpStatusText.SUCCESS });
});

// Fetch single case
export const getSingleCase = asyncWrapper(async (req, res, next) => {
  const { caseId } = req.params;

  checkIdValidity(caseId, res, req.user._id);

  const singleCase = await Case.findOne({ _id: caseId, internId: req.user._id })
    .populate("roundId reviewedBy", "name fullname")
    .select("-__v")
    .lean();

  if (!singleCase)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Case not found",
    });

  return res
    .status(200)
    .json({ code: 200, data: singleCase, message: "Case fetched." });
});

// Add new case
export const addCase = asyncWrapper(async (req, res, next) => {
  const { roundId, ...caseData } = req.body;

  checkIdValidity(roundId, res);

  const newCase = new Case({
    internId: req.user._id,
    roundId,
    state: "under_review",
    ...caseData,
  });

  const savedCase = await newCase.save();

  if (!savedCase)
    return res.status(400).json({ message: "Failed adding new case" });

  const updateResult = await Intern.updateOne(
    {
      _id: req.user._id,
      "trainingProgress.roundId": roundId,
    },
    {
      $addToSet: {
        "trainingProgress.$.cases": savedCase._id,
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
            cases: [savedCase._id],
            procedures: [],
            selfLearning: [],
            directLearning: [],
          },
        },
      }
    );
  }
  return res
    .status(201)
    .json({ code: 201, data: newCase, message: "New case added" });
});

// Edit Case
export const editCase = asyncWrapper(async (req, res, next) => {
  const { caseId } = req.params;
  const { editMode } = req.query;
  const {
    roundId,
    patientGender,
    patientSerial,
    patientAge,
    venue,
    caseType,
    epas,
    expectedLevel,
    caseSummary,
    selfReflection,
  } = req.body;
  checkIdValidity(caseId, res);

  if (!editMode || editMode !== "true") {
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Edit mode not enabled",
    });
  }

  const singleCase = await Case.findOne({ _id: caseId, internId: req.user._id })
    .populate("roundId", "name")
    .lean();

  if (!singleCase)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Case not found",
    });

  if (singleCase.state === "accepted")
    return res.status(403).json({
      code: 403,
      status: httpStatusText.FAIL,
      message: "This case is accpeted and can't be edit",
    });

  const updatedCase = await Case.updateOne(
    { _id: caseId, internId: req.user._id },
    {
      epas,
      roundId,
      patientGender: patientGender,
      patientSerial: patientSerial,
      patientAge: patientAge,
      venue: venue,
      caseType: caseType,
      expectedLevel: expectedLevel,
      caseSummary: caseSummary,
      selfReflection: selfReflection,
      epas: epas,
    },
    { new: true }
  );

  if (!updatedCase)
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Error updating case, try again later",
    });

  return res
    .status(200)
    .json({ code: 200, data: updatedCase, message: "Case updated." });
});

// Delete Case
export const deleteCase = asyncWrapper(async (req, res, next) => {
  const { caseId } = req.params;
  checkIdValidity(caseId, res, req.user._id);

  const singleCase = await Case.findOne({
    _id: caseId,
    internId: req.user._id,
  });

  if (!singleCase)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.FAIL,
      message: "Case not found",
    });

  if (singleCase.state === "accepted")
    return res.status(403).json({
      code: 403,
      status: httpStatusText.FAIL,
      message: "Accepted case can't be deleted",
    });

  const deletedCase = await Case.findByIdAndDelete(caseId);
  if (!deletedCase) {
    return res.status(400).json({
      code: 400,
      status: httpStatusText.ERROR,
      message: "Failed to delete case",
    });
  }

  const updateResult = await Intern.updateOne(
    {
      _id: req.user._id,
      "trainingProgress.roundId": singleCase.roundId,
    },
    { $pull: { "trainingProgress.$.cases": caseId } },
    { new: true }
  );

  console.log(updateResult);

  if (updateResult.modifiedCount === 0)
    throw new Error("ERROR: failed updating ypur progress");

  return res.status(200).json({ code: 200, message: "Case deleted." });
});
