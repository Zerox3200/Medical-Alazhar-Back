import Admin from "../models/admin/admin.model.js";
import httpStatusText from "../utils/httpStatusText.js";
import { ErrorCatch } from "../utils/appError.js";

const isAdmin = ErrorCatch(async (req, res, next) => {
  const { id } = req.user;

  const admin = await Admin.findOne({ _id: id });

  if (!admin) {
    return res.status(403).json({
      status: httpStatusText.FORBIDDEN,
      code: 403,
      message: "You are not authorized to perform this action.",
    });
  }

  next();
});



export default isAdmin;
