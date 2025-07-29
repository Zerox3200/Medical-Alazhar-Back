import { check } from "express-validator";

export const loginValidation = [
  check("email").notEmpty().withMessage("Please add your email."),
  check("password").notEmpty().withMessage("Please add your password."),
];

export const changePasswordValidation = [
  // Current Password
  check("currentPassword")
    .notEmpty()
    .withMessage("Please add your current password"),
  // New Password
  check("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain uppercase and lowercase letters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain uppercase and lowercase letters.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character.")
    .custom((input, { req }) => {
      if (input !== req.body.confirmPassword)
        throw new Error("Password not matched");

      return true;
    }),
  // Confirm Password
  check("confirmPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain uppercase and lowercase letters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain uppercase and lowercase letters.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character.")
    .custom((input, { req }) => {
      if (input !== req.body.confirmPassword)
        throw new Error("Password not matched");

      return true;
    }),
  ,
];
