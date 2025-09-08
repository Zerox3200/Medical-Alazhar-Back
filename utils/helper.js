import jwt from "jsonwebtoken";

// Generate Access Tokens
export const generateAccessToken = (user) => {
  const accessToken = jwt.sign(
    {
      _id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    "CheeseCake",
    { expiresIn: "1d" }
  );

  return accessToken;
};

// Generate Refresh Tokens
export const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(
    {
      _id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    "CheeseCake",
    { expiresIn: "7d" }
  );

  return refreshToken;
};

// Generate Reset Tokens
export const generateResetToken = (userId) => {
  const resetToken = jwt.sign({ userId }, "CheeseCake", {
    expiresIn: "15m",
  });

  return resetToken;
};
