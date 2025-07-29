import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import Supervisor from "../../models/supervisor/supervisor.models.js";
import checkIdValidity from "../../utils/checkIdValidity.js";
import caseInsensitiveFilters from "../../utils/caseInsensitiveFilters.js";

// Get all supervisors
export const getAllSupervisors = asyncWrapper(async (req, res, next) => {
  const filters = { ...req.query };

  const supervisors = await Supervisor.find(
    caseInsensitiveFilters(filters, Supervisor)
  ).select("-__v -password");

  if (!supervisors)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      code: 422,
      message: "No Supervisors.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    count: supervisors.length,
    supervisors,
  });
});

// Get Single Supervisor
export const getSingleSupervisor = asyncWrapper(async (req, res, next) => {
  const { supervisorId } = req.params;

  const supervisor = await Supervisor.findOne({
    _id: supervisorId,
  }).select("-__v -password");

  if (!supervisor)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      code: 422,
      message: "Supervisor not found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    supervisor,
  });
});

// Change supervisors role
export const changeSupervisorRole = asyncWrapper(async (req, res, next) => {
  const { supervisorId } = req.params;
  const { role } = req.body;

  checkIdValidity(supervisorId, res);

  const updatedSupervisor = await Supervisor.findByIdAndUpdate(
    supervisorId,
    { role },
    { new: true }
  );

  if (!updatedSupervisor)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      code: 422,
      message: "Supervisor not found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Role updated",
  });
});
