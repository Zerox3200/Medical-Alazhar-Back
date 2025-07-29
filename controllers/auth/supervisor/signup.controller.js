import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import Supervisor from "../../../models/supervisor/supervisor.models.js";
import httpStatusText from "../../../utils/httpStatusText.js";
import bcrypt from "bcryptjs";

// Signup New Supervisor
export const supervisorSignup = asyncWrapper(async (req, res, next) => {
  const { fullname, email, phone, password, speciality, hospital } = req.body;

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newSupervisor = new Supervisor({
    fullname,
    email,
    phone,
    hospital,
    speciality,
    password: hashedPassword,
  });

  if (!newSupervisor)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      message: "Error creating new account",
    });

  await newSupervisor.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Account created successfully!",
  });
});
