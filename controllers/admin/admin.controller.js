import checkIdValidity from "../../utils/checkIdValidity.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import Admin from "../../models/admin/admin.model.js";
import Supervisor from "../../models/supervisor/supervisor.models.js";
import Intern from "../../models/intern/Intern.models.js";
import { imageUploader } from "../uploads/uploader.controller.js";

// Get not approved accounts
export const getNotApprovedUsers = asyncWrapper(async (req, res, next) => {
  const [interns, supervisors] = await Promise.all([
    Intern.find(
      { approved: false },
      "fullname hospital phone idOrPassport.number role approved"
    ).lean(),
    Supervisor.find(
      { approved: false },
      "fullname hospital phone role approved"
    ).lean(),
  ]);

  if (!interns || !supervisors)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Not found",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    users: [...interns, ...supervisors],
  });
});

// Approve request for all users
export const approveUserAccount = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const { approved } = req.body;

  checkIdValidity(userId, res);

  const [admin, intern, supervisor] = await Promise.all([
    Admin.findById(userId),
    Intern.findById(userId),
    Supervisor.findById(userId),
  ]);

  const userDoc = admin || intern || supervisor;

  if (!userDoc) {
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "User not found",
    });
  }

  let Model;
  if (admin) Model = Admin;
  else if (intern) Model = Intern;
  else Model = Supervisor;

  const updatedUser = await Model.findByIdAndUpdate(
    userId,
    { approved },
    { new: true }
  );
  if (!updatedUser) {
    return res.status(422).json({
      status: httpStatusText.ERROR,
      code: 422,
      message: "Update failed. Try again later.",
    });
  }
  return res.status(200).json({
    status: approved ? httpStatusText.SUCCESS : httpStatusText.FAIL,
    code: approved ? 200 : 403,
    message: `Account ${approved ? "" : "not "}approved`,
  });
});

// Modify account lock
export const modifyAccountLock = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const { isLocked } = req.body;

  checkIdValidity(userId, res);

  const [admin, intern, supervisor] = await Promise.all([
    Admin.findById(userId),
    Intern.findById(userId),
    Supervisor.findById(userId),
  ]);

  const userDoc = admin || intern || supervisor;

  if (!userDoc) {
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "User not found",
    });
  }

  let Model;
  if (admin) Model = Admin;
  else if (intern) Model = Intern;
  else Model = Supervisor;

  const updatedUser = await Model.findByIdAndUpdate(
    userId,
    { isLocked },
    { new: true }
  );
  if (!updatedUser) {
    return res.status(422).json({
      status: httpStatusText.ERROR,
      code: 422,
      message: "Update failed. Try again later.",
    });
  }
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: `Account ${isLocked ? "locked" : "opened"}`,
  });
});

// Get admin data
export const adminData = asyncWrapper(async (req, res, next) => {
  const { adminId } = req.params;
  checkIdValidity(adminId, res);
  const admin = await Admin.findById(adminId).select("-__v -password");

  if (!admin)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "Admin not found",
    });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    admin,
  });
});

// Upload profile image
export const uploadAdminProfileImage = asyncWrapper(async (req, res, next) => {
  const { adminId } = req.params;
  checkIdValidity(adminId, res);

  await imageUploader(req, res, next, Admin, adminId);
});
