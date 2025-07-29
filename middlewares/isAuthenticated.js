import httpStatusText from "../utils/httpStatusText.js";
import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
  try {
    const authHeader =
      req.headers["Authorization"] || req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token)
      return res.status(401).json({
        status: httpStatusText.UNAUTHORIZED,
        code: 401,
        message: "Please log in to access this resource",
      });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (error, user) => {
      if (error)
        return res.status(401).json({
          status: httpStatusText.UNAUTHORIZED,
          code: 401,
          message: "You are not authorized to perform this action.",
        });
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      status: httpStatusText.ERROR,
      code: 500,
      message: "Authentication failed",
      error,
    });
  }
};

export default isAuthenticated;
