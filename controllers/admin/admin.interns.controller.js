import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import Intern from "../../models/intern/Intern.models.js";
import checkIdValidity from "../../utils/checkIdValidity.js";
import Case from "../../models/training/case.models.js";

// Get all interns
export const getAllInterns = asyncWrapper(async (req, res, next) => {
  const filters = { ...req.query };

  if (filters.grade) filters.grade = filters.grade.replace(" ", "+");

  const interns = await Intern.find(filters)
    .select("-__v -password")
    .sort({ fullname: "asc" });
  if (!interns)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      code: 422,
      message: "No Interns.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    count: interns.length,
    interns,
  });
});

// Get single intern
export const getSingleIntern = asyncWrapper(async (req, res, next) => {
  const { internId } = req.params;
  checkIdValidity(internId, res);

  const intern = await Intern.findById(internId).select("-__v -password");
  if (!intern)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      code: 422,
      message: "Intern not found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    intern,
  });
});

// Get all cases
export const getAllCases = asyncWrapper(async (req, res, next) => {
  const cases = await Case.find().select("-__v");
  if (!cases.length > 0)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      code: 422,
      message: "No cases found.",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    count: cases.length,
    cases,
  });
});
