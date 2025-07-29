import httpStatusText from "../utils/httpStatusText.js";

const isAuthorizedSupervisor = (req, res, next) => {
  const userIdFromUrl = req.params.supervisorId;
  const userIdFromToken = req.user._id;

  if (userIdFromUrl !== userIdFromToken) {
    return res.status(403).json({
      status: httpStatusText.FORBIDDEN,
      code: 403,
      message: "Forbidden: You are not authorized to perform this action.",
    });
  }
  next();
};

export default isAuthorizedSupervisor;
