import { ObjectId } from "mongodb";
import Intern from "../../models/intern/Intern.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import Supervisor from "../../models/supervisor/supervisor.models.js";
import checkIdValidity from "../../utils/checkIdValidity.js";
import Round from "../../models/round/round.models.js";
import Assessment from "../../models/training/assessment.models.js";
import Case from "../../models/training/case.models.js";
import Procedure from "../../models/training/procedure.model.js";
import SelfLearning from "../../models/training/self_learning.models.js";
import DirectLearning from "../../models/training/direct_learning.models.js";
import mongoose from "mongoose";

// Get my interns
export const getMyInterns = asyncWrapper(async (req, res, next) => {
  const { supervisorId } = req.params;
  checkIdValidity(supervisorId, res);
  const supervisorInterns = await Intern.find({
    "currentRound.supervisor": supervisorId,
  })
    .select(
      "fullname currentRound phone facultyIDNumber profileImage  trainingProgress"
    )
    .lean();

  if (!supervisorInterns)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Failed fetching interns",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    count: supervisorInterns.length,
    data: supervisorInterns,
    code: 200,
  });
});

// Get my intern
export const getMyIntern = asyncWrapper(async (req, res, next) => {
  const { supervisorId, internId } = req.params;
  checkIdValidity(internId, res);

  const myIntern = await Intern.findOne(
    {
      _id: internId,
      "trainingProgress.supervisorId": supervisorId,
    },
    {
      fullname: 1,
      arabicName: 1,
      email: 1,
      phone: 1,
      facultyIDNumber: 1,
      hospital: 1,
      nationality: 1,
      trainingProgress: 1,
      profileImage: 1,
    }
  ).populate([
    { path: "trainingProgress.cases", model: "case" },
    { path: "trainingProgress.procedures", model: "procedure" },
  ]);

  if (!myIntern)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Intern not found",
    });

  const filteredProgress = myIntern.trainingProgress?.filter((progress) =>
    progress.supervisorId?.equals(supervisorId)
  );

  const result = {
    fullname: myIntern.fullname,
    arabicName: myIntern.arabicName,
    phone: myIntern.phone,
    email: myIntern.email,
    hospital: myIntern.hospital,
    nationality: myIntern.nationality,
    facultyIDNumber: myIntern.facultyIDNumber,
    trainingProgress: filteredProgress,
    profileImage: myIntern.profileImage,
  };

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    data: result,
  });
});

// Handle supervisor training domains acceptance
export const acceptTrainingDomains = asyncWrapper(async (req, res, next) => {
  const { internId } = req.params;
  const { updatedState } = req.body;
  const { domainType, domainId } = req.query;
  checkIdValidity(internId, res);

  // Find the requested domain
  if (!domainType)
    return res.status(400).json({ message: "Please select the domain type" });

  let matchedDomain;
  let [theCase, procedure, selfActivity, directActivity] = await Promise.all([
    Case.findById(domainId),
    Procedure.findById(domainId),
    SelfLearning.findById(domainId),
    DirectLearning.findById(domainId),
  ]);

  if (theCase || procedure || selfActivity || directActivity) {
    matchedDomain = theCase || procedure || selfActivity || directActivity;

    // Check if this domain corresponding to the the supervisor's round
    const supervisor = await Supervisor.findById(req.user._id, {
      round: 1,
      assignedInterns: 1,
    });
    if (supervisor.round?.toString() !== matchedDomain?.roundId?.toString()) {
      return res
        .status(404)
        .json({ message: "This case is not listed in the current round" });
    }

    const isMyIntern = supervisor?.assignedInterns?.some(
      (i) => i.internId.toString() === internId.toString()
    );

    if (!isMyIntern)
      return res
        .status(401)
        .json({ message: "You are not authorized to modify this" });

    const result = await matchedDomain.constructor.findOneAndUpdate(
      { _id: matchedDomain._id },
      { state: updatedState, reviewedBy: req.user._id },
      { new: true }
    );

    console.log(result);
    return res.status(200).json({
      code: 200,
      message: "State updated",
      data: { state: result.state, reviewedBy: result.reviewedBy },
    });
  } else {
    return res.status(404).json({ message: "Training domain not found" });
  }
});

// add intern assessment

/* 
     ************* CONTROLLER ROLE *************:
 *** Add new assessment if not exists
 *** If exists: add new question to the assessment for the same
     intern in the same round
*/

// Get round waves
export const getRoundWaves = asyncWrapper(async (req, res, next) => {
  const { supervisorId } = req.params;
  const { roundId } = req.query;

  checkIdValidity(supervisorId, res, roundId);

  if (
    !mongoose.Types.ObjectId.isValid(supervisorId) ||
    !mongoose.Types.ObjectId.isValid(roundId)
  ) {
    return res.status(400).json({
      message: "Invalid ID format: Must be 24-character hex string",
    });
  }

  const roundWaves = await Round.aggregate([
    { $match: { _id: ObjectId.createFromHexString(roundId) } },
    { $unwind: "$waves" },
    {
      $lookup: {
        from: "interns",
        let: { waveInternIds: "$waves.interns" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$waveInternIds"] },
                  {
                    $or: [
                      {
                        $eq: [
                          "$currentRound.supervisor",
                          ObjectId.createFromHexString(supervisorId),
                        ],
                      },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$trainingProgress",
                                as: "progress",
                                cond: {
                                  $eq: [
                                    "$$progress.supervisorId",
                                    ObjectId.createFromHexString(supervisorId),
                                  ],
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              fullname: 1,
              email: 1,
              _id: 1,
              facultyIDNumber: 1,
              hospital: 1,
            },
          },
        ],
        as: "waves.supervisedInterns",
      },
    },

    { $match: { "waves.supervisedInterns.0": { $exists: true } } },

    {
      $group: {
        _id: "$_id",
        roundName: { $first: "$name" },
        waves: { $push: "$waves" },
      },
    },

    {
      $project: {
        _id: 1,
        roundName: 1,
        waves: {
          $map: {
            input: "$waves",
            as: "wave",
            in: {
              waveOrder: "$$wave.waveOrder",
              startDate: "$$wave.startDate",
              endDate: "$$wave.endDate",
              waveStatus: "$$wave.waveStatus",
              interns: "$$wave.supervisedInterns",
            },
          },
        },
      },
    },
  ]);

  if (roundWaves.length === 0) {
    return res.status(404).json({
      message: "No waves with your interns found in this round",
    });
  }

  return res.status(200).json(roundWaves);
});

// Add new assessment
export const addAssessment = asyncWrapper(async (req, res, next) => {
  const { roundId, supervisorId } = req.params;
  const { internId, assessmentType, assessmentDomains, assessmentDate } =
    req.body;

  const assessment = new Assessment({
    roundId,
    supervisorId,
    internId,
    assessmentDate,
    assessmentType,
    assessmentDomains: [...assessmentDomains],
  });
  const savedAssessment = await assessment.save();
  if (!savedAssessment)
    return res.status(400).json({ message: "Error adding new assessment" });

  // Append assessemnt to intern training progress
  await Intern.updateOne(
    { _id: internId, "trainingProgress.roundId": roundId },
    {
      $push: {
        "trainingProgress.$.assessments": savedAssessment._id,
      },
    }
  );

  return res.status(201).json({
    code: 201,
    status: httpStatusText.SUCCESS,
    message: "Added successfully",
  });
});

// Pass/Fail assessment
export const reviewAssessment = asyncWrapper(async (req, res, next) => {
  const { supervisorId, internId, assessmentId } = req.params;
  const { isPassed } = req.body;
  const assessment = await Assessment.findOne({
    _id: assessmentId,
    supervisorId,
    internId,
  });

  if (!assessment)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Assessment not found",
    });

  await Assessment.updateOne(
    {
      _id: assessmentId,
      supervisorId,
      internId,
    },
    { $set: { isPassed } }
  );

  return res.status(200).json({
    code: 200,
    status: httpStatusText.SUCCESS,
    message: "Assessment updated",
  });
});

// Get assessments
export const getAssessments = asyncWrapper(async (req, res, next) => {
  const { roundId, supervisorId } = req.params;
  checkIdValidity(supervisorId, res, roundId);

  const assessments = await Assessment.find({ roundId, supervisorId })
    .populate("internId", "fullname facultyIDNumber")
    .lean();

  if (!assessments)
    return res.status(404).json({ message: "No assessments found" });

  return res.status(200).json({
    assessments,
    count: assessments.length,
    message: "found " + assessments.length + " assessments",
  });
});
