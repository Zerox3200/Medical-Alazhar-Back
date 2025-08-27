import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import Admin from "../../../models/admin/admin.model.js";
import httpStatusText from "../../../utils/httpStatusText.js";
import bcrypt from "bcryptjs";

// Signup new admin
export const adminSignup = asyncWrapper(async (req, res, next) => {
  const { fullname, email, phone, password } = req.body;
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newAdmin = new Admin({
    fullname,
    email,
    phone,
    password: hashedPassword,
  });

  if (!newAdmin)
    return res.status(422).json({
      status: httpStatusText.ERROR,
      message: "Error creating admin account",
    });

  await newAdmin.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Account created successfully!",
  });
});
