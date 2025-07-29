import Intern from "../../../models/intern/Intern.models.js";
import bcrypt from "bcryptjs";
import httpStatusText from "../../../utils/httpStatusText.js";
import asyncWrapper from "../../../middlewares/asyncWrapper.js";

export const internSignup = asyncWrapper(async (req, res, next) => {
  const {
    fullname,
    arabicName,
    dob,
    cummulativeTotal,
    internshipStartDate,
    internLevel,
    nationality,
    facultyOfGraduation,
    yearOfGraduation,
    idOrPassport,
    facultyIDNumber,
    grade,
    orderOfGraduate,
    hospital,
    email,
    phone,
    password,
  } = req.body;

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newIntern = new Intern({
    fullname,
    arabicName,
    dob,
    cummulativeTotal,
    internshipStartDate,
    internLevel,
    nationality,
    facultyOfGraduation,
    yearOfGraduation,
    idOrPassport,
    facultyIDNumber,
    grade,
    orderOfGraduate,
    hospital,
    email,
    phone,
    password: hashedPassword,
  });

  if (!newIntern)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      message: "Error creating account",
    });
  await newIntern.save();
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Account created successfully!",
  });
});
