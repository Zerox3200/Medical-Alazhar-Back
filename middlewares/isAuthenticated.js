import httpStatusText from "../utils/httpStatusText.js";
import jwt from "jsonwebtoken";
import { ErrorCatch } from "../utils/appError.js";
import Admin from "../models/admin/admin.model.js";
import Intern from "../models/intern/Intern.models.js";
import Supervisor from "../models/supervisor/supervisor.models.js";

const isAuthenticated = ErrorCatch(async (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader?.split(" ")[1];


  if (!token) {
    return res.status(401).json({
      status: httpStatusText.UNAUTHORIZED,
      code: 401,
      message: "Please log in to access this resource",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);

    // Await DB lookups
    const [admin, intern, supervisor] = await Promise.all([
      Admin.findOne({ email: decoded.email }),
      Intern.findOne({ email: decoded.email }),
      Supervisor.findOne({ email: decoded.email }),
    ]);

    req.user = admin || intern || supervisor;

    if (!req.user) {
      return res.status(401).json({
        status: httpStatusText.UNAUTHORIZED,
        code: 401,
        message: "User not found.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: httpStatusText.UNAUTHORIZED,
      code: 401,
      message: "You are not authorized to perform this action.",
    });
  }
});


export default isAuthenticated;
