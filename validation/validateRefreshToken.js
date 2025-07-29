import jwt from "jsonwebtoken";

export const validateRefreshToken = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "No token provided" });

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET_KEY,
    (error, user) => {
      if (error) return res.status(403).json({ message: "Invalid token" });
      req.user = user;
      next();
    }
  );
};
