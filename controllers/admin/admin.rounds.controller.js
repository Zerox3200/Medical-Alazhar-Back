import Round from "../../models/round/round.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import Supervisor from "../../models/supervisor/supervisor.models.js";
import _ from "lodash";
import Intern from "../../models/intern/Intern.models.js";
import checkIdValidity from "../../utils/checkIdValidity.js";
import caseInsensitiveFilters from "../../utils/caseInsensitiveFilters.js";

// Create new round
export const createRound = asyncWrapper(async (req, res, next) => {
  const {
    name,
    duration,
    numericYear,
    hospital,
    supervisors,
    coordinator,
    wave,
  } = req.body;
  const round = new Round({
    name: _.snakeCase(name),
    duration,
    numericYear,
    hospital,
    supervisors: supervisors || [],
    coordinator: coordinator || null,
    wave: wave || [],
  });

  if (!round)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      message: "Error creating new round",
    });

  await round.save();
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    roundId: round._id,
    message: "New round added!",
  });
});

// Insert wave
export const insertWave = asyncWrapper(async (req, res, next) => {
  const { roundId } = req.params;
  const { waveOrder, startDate, endDate, waveStatus, interns } = req.body;
  checkIdValidity(roundId, res);

  // Check existsing round
  const round = await Round.findById({ _id: roundId }).select("_id").lean();

  if (!round)
    return res.status(404).json({
      code: 404,
      status: httpStatusText.ERROR,
      message: "Round not found",
    });

  const newWave = await Round.updateOne(
    { _id: roundId },
    {
      $addToSet: {
        waves: {
          waveOrder,
          startDate,
          endDate,
          waveStatus: waveStatus || "ongoing",
          interns: interns || [],
        },
      },
    },
    { upsert: true }
  );

  if (!newWave)
    return res.status(400).json({
      code: 400,
      status: httpStatusText.FAIL,
      message: "Error: failed to add new wave",
    });

  return res.status(200).json({
    code: 200,
    data: newWave,
    status: httpStatusText.SUCCESS,
    message: "New wave inserted.",
  });
});

// Get all rounds
export const getAllRounds = asyncWrapper(async (req, res, next) => {
  const filters = { ...req.query };
  const rounds = await Round.find(caseInsensitiveFilters(filters, Round))
    .select("-__v")
    .lean();

  if (!rounds)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,

      message: "No rounds found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    count: rounds.length,
    rounds,
    message: "All rounds.",
  });
});

// Get round
export const getRound = asyncWrapper(async (req, res, next) => {
  const { roundId } = req.params;

  checkIdValidity(roundId, res);

  const round = await Round.findById(roundId)
    .populate("coordinator", "fullname hospital phone speciality role")
    .populate("supervisors", "fullname hospital phone speciality role")
    .populate(
      "waves.interns",
      "fullname hospital facultyIDNumber nationality phone role"
    )
    .lean();

  if (!round)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Round not found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    round: [round],
    message: "Fetched successfully.",
  });
});

// Drop round
export const dropRound = async (req, res, next) => {
  const { roundId } = req.params;

  checkIdValidity(roundId, res);

  const round = await Round.findByIdAndDelete(roundId);
  if (!round) {
    return res.status(404).json({ error: "Round not found" });
  }

  const result = await Promise.all([
    Intern.updateMany(
      {
        "currentRound.round": roundId,
      },
      { $unset: { currentRound: {} } }
    ),
    Supervisor.updateMany({ round: roundId }, { $unset: { round: "" } }),
  ]);

  console.log(result);

  return res.json({
    success: true,
    message: "Round deleted (references cleaned up)",
  });
};

// Assign supervisor to round
export const assignSupervisor = asyncWrapper(async (req, res, next) => {
  const { roundId } = req.params;
  const { supervisorId } = req.body;

  checkIdValidity(supervisorId, res, roundId);

  let supervisor = await Supervisor.findOne({
    _id: supervisorId,
    role: "supervisor",
  })
    .select("-password -__v -email")
    .populate("round", "name");

  if (!supervisor)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Supervisor not found.",
    });

  const targetRound = await Round.findById(roundId);

  if (!targetRound) {
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Round not found.",
    });
  }

  if (targetRound.supervisors.length >= 4)
    return res.status(422).json({
      status: httpStatusText.FAIL,
      code: 422,
      message: "Maximum number of supervisors.",
    });

  // if (supervisor.round.roundId)
  //   return res.status(422).json({
  //     status: httpStatusText.FAIL,
  //     code: 422,
  //     message: `This supervisor is already asssigned in another round`,
  //   });

  if (targetRound.hospital !== supervisor.hospital)
    return res.status(422).json({
      status: httpStatusText.FAIL,
      code: 422,
      message: "This supervisor is not in this hospital",
    });

  supervisor.round = targetRound._id;
  supervisor.assignedInterns = [];
  await supervisor.save();

  const updatedRound = await Round.findByIdAndUpdate(
    roundId,
    {
      $addToSet: { supervisors: supervisor._id },
    },
    { new: true }
  ).populate("supervisors");

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    round: updatedRound,
    message: "New supervisor assigned to this round",
  });
});

// Assign coordinator to round
export const assignCoordinator = asyncWrapper(async (req, res, next) => {
  const { roundId } = req.params;
  const { coordinatorId } = req.body;

  checkIdValidity(coordinatorId, res, roundId);

  let coordinator = await Supervisor.findOne({
    _id: coordinatorId,
    role: "coordinator",
  }).populate("round", "name");

  if (!coordinator)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Coordinator not found.",
    });

  // if (coordinator.round.roundId)
  //   return res.status(422).json({
  //     status: httpStatusText.FAIL,
  //     code: 422,
  //     message: `This coordinator is already asssigned in another round`,
  //   });

  const targetRound = await Round.findById(roundId);

  if (!targetRound)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Error: round not found",
    });

  if (targetRound.hospital !== coordinator.hospital)
    return res.status(422).json({
      status: httpStatusText.FAIL,
      code: 422,
      message: "This coordinator is not in this hospital",
    });

  const updatedRound = await Round.findByIdAndUpdate(
    roundId,
    { coordinator: coordinator._id },
    { new: true }
  ).populate("coordinator", "fullname");

  coordinator.round = targetRound._id;
  await coordinator.save();

  if (!updatedRound)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Error: round not found",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    round: updatedRound,
    message: "New coordinator assigned to this round",
  });
});

// Assign intern to round
export const assignIntern = asyncWrapper(async (req, res, next) => {
  const { roundId } = req.params;
  const { internId, waveId } = req.body;

  checkIdValidity(internId, res, roundId);

  if (!waveId)
    return res.status(400).json({ message: "Please select the wave" });

  let intern = await Intern.findOne({
    _id: internId,
    role: "intern",
  })
    .populate("currentRound.roundId", "name")
    .select("-__v -password");

  if (!intern)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Intern not found.",
    });

  const targetRound = await Round.findById(roundId);

  if (!targetRound) {
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Round not found.",
    });
  }

  // if (intern.currentRound?.roundId && !intern.currentRound.completed)
  //   return res.status(422).json({
  //     status: httpStatusText.FAIL,
  //     code: 422,
  //     message: `This intern is already asssigned to an incompleted round`,
  //   });

  if (intern.hospital.toString() !== targetRound.hospital.toString())
    return res.status(422).json({
      status: httpStatusText.FAIL,
      code: 422,
      message: "This intern is not in this hospital",
    });

  intern.currentRound = {
    roundId: targetRound._id,
    waveId,
    completed: false,
  };

  intern.trainingProgress.push({
    roundId: targetRound._id,
    completed: false,
    cases: [],
    procedures: [],
    selfLearning: [],
    directLearning: [],
  });
  await intern.save();

  const updatedRound = await Round.findOneAndUpdate(
    { _id: roundId },
    {
      $addToSet: { "waves.$[wave].interns": intern._id },
    },
    { arrayFilters: [{ "wave._id": waveId }], new: true }
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    round: updatedRound,
    message: "New intern assigned to this round",
  });
});
