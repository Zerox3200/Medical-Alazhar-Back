import httpStatusText from "../utils/httpStatusText.js";

const isAdmin = (req, res, next) => {
  const { role } = req.user;
  if (role !== "admin")
    return res.status(403).json({
      status: httpStatusText.FORBIDDEN,
      code: 403,
      message: "You are not authorized to perform this action.",
    });
  next();
};

export default isAdmin;
