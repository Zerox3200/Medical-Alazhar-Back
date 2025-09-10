import jwt from "jsonwebtoken";

// Generate Access Tokens
export const generateAccessToken = (user) => {
  const accessToken = jwt.sign(
    {
      _id: user._id.toString(),
      role: user.role || "user",
      email: user.email,
    },
    process.env.ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: "1d" }
  );

  return accessToken;
};

// Generate Refresh Tokens
export const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(
    {
      _id: user._id.toString(),
      role: user.role || "user",
      email: user.email,
    },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: "7d" }
  );

  return refreshToken;
};

// Generate Reset Tokens
export const generateResetToken = (userId) => {
  const resetToken = jwt.sign({ userId }, process.env.RESET_TOKEN_SECRET_KEY, {
    expiresIn: "15m",
  });

  return resetToken;
};
