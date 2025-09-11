import checkIdValidity from "../../utils/checkIdValidity.js";
import Admin from "../../models/admin/admin.model.js";
import Intern from "../../models/intern/Intern.models.js";
import Supervisor from "../../models/supervisor/supervisor.models.js";
import bcrypt from "bcryptjs";
import {
  generateRefreshToken,
  generateAccessToken,
} from "../../utils/helper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import User from "../../models/Users/Users.model.js";

// Handle login common logic
const handleUserLogin = async (user, password, Model, res) => {

  // if (user.isLocked) {
  //   return res.status(403).json({
  //     status: httpStatusText.FAIL,
  //     code: 403,
  //     message: "Account locked due to too many failed login attempts.",
  //   });
  // }


  const matched = await bcrypt.compare(password, user.password);
  console.log(password, user.password);

  if (!matched) {
    const updatedUser = await Model.findOneAndUpdate(
      { email: user.email },
      {
        $inc: { loginAttempts: 1 },
        $set: { isLocked: user.loginAttempts + 1 >= 3 },
      },
      { new: true }
    );

    console.log(updatedUser);

    if (updatedUser.loginAttempts >= 3) {
      return res.status(403).json({
        status: httpStatusText.FAIL,
        code: 403,
        message: "Account locked due to too many failed login attempts.",
      });
    }

    return res.status(422).json({
      status: httpStatusText.FAIL,
      code: 422,
      message: `Incorrect Credentials, you only have ${3 - updatedUser.loginAttempts
        } attempts left`,
    });
  }
  // Set Login Time
  const loginTime = new Date().toUTCString();
  user.lastLogin = loginTime;
  user.loginAttempts = 0;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });


  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Welcome back",
    accessToken,
    data: { user: { id: user._id, role: user.role || "user" } },
  });
};

// LOGIN
export const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  const results = await Promise.all([
    Admin.findOne({ email }),
    Intern.findOne({ email }),
    Supervisor.findOne({ email }),
    User.findOne({ email }),
  ]);

  if (results.length > 0) {
    const userDoc = results.filter((user) => Boolean(user));
    const Model = userDoc[0]?.constructor;

    if (!userDoc[0])
      return res.status(422).json({
        status: httpStatusText.FAIL,
        code: 422,
        message: "Incorrect Credentials",
      });
    return handleUserLogin(userDoc[0], password, Model, res);
  }
});

// Logout
export const logout = (req, res, next) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, code: 200, message: "Logged out" });
};

// Change Password
export const changePassword = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const { currentPassword, newPassword, confirmPassword } = req.body;
  checkIdValidity(userId, res);

  const results = await Promise.all([
    Admin.findOne({ _id: userId }),
    Intern.findOne({ _id: userId }),
    Supervisor.findOne({ _id: userId }),
    User.findOne({ _id: userId }),
  ]);

  if (results.length > 0) {
    const userDoc = results.filter((user) => Boolean(user));
    const Model = userDoc[0]?.constructor;

    if (!userDoc[0])
      return res.status(404).json({
        status: httpStatusText.FAIL,
        code: 404,
        message: "Not found",
      });

    const matched = await bcrypt.compare(currentPassword, userDoc[0].password);
    if (!matched)
      return res.status(422).json({
        status: httpStatusText.FAIL,
        code: 422,
        message: "Wrong password",
      });

    const isEqual = newPassword === confirmPassword;

    if (!isEqual)
      return res
        .status(400)
        .json({
          code: 400,
          status: httpStatusText.FAIL,
          message: "Password not matched",
        });

    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    const updatedPassword = await Model.findOneAndUpdate(
      { _id: userId },
      { password: hashedNewPassword }
    );

    if (!updatedPassword)
      return res.status(422).json({
        code: 422,
        status: httpStatusText.ERROR,
        message: "Error changing password",
      });

    return res.status(200).json({
      code: 200,
      status: httpStatusText.SUCCESS,
      message: "Password changed",
    });
  }
});


// Get User Data by token
export const getUserData = asyncWrapper(async (req, res, next) => {

  const NeededUser = {
    ...req.user._doc,
    role: req.user.role || "user",
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "User data fetched",
    data: NeededUser,
  });

});