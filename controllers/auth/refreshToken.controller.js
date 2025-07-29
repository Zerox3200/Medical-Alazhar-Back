import jwt from "jsonwebtoken";
import { generateAccessToken } from "../../utils/helper.js";
import appError from "../../utils/appError.js";
import httpStatusText from "../../utils/httpStatusText.js";

const refreshToken = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      code: 401,
      message: "Access denied, token missing!",
    });
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET_KEY,
    (error, user) => {
      if (error)
        return appError(
          { message: "Invalid refresh token" },
          403,
          httpStatusText.ERROR
        );
      const accessToken = generateAccessToken(user);

      return res
        .status(200)
        .json({ accessToken, user: { id: user._id, role: user.role } });
    }
  );
};

export default refreshToken;
