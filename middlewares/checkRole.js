import httpStatusText from "../utils/httpStatusText.js";

const checkRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        status: httpStatusText.FORBIDDEN,
        code: 403,
        message: "INVALID ROLE: You are not authorized to perform this action.",
      });
    }
    next();
  };
};

export default checkRole;
