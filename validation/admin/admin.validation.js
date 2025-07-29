import { check } from "express-validator";
import Admin from "../../models/admin/admin.model.js";
import _ from "lodash";

// Check if user existed in database
const checkExistingUser = async (record, msg) => {
  const user = await Admin.findOne(record);
  if (user) {
    throw new Error(msg);
  }
};

export const adminSignupValidation = [
  // Fullname
  check("fullname")
    .notEmpty()
    .trim()
    .withMessage("Fullname must be provided")
    .matches(/^[A-Za-z-]{2,}(\s[A-Za-z-]{2,}){3,}$/)
    .withMessage("Please enter your name as in your national ID"),
  // Email
  check("email")
    .notEmpty()
    .trim()
    .withMessage("Email must be provided")
    .isEmail()
    .withMessage("Email value is not valid")
    .toLowerCase()
    .custom(async (input) => {
      await checkExistingUser({ email: input }, "Email already in use");
    }),
  // Phone
  check("phone")
    .notEmpty()
    .trim()
    .withMessage("Phone must be provided")
    .matches(/^(?:\+20)?01[0-2,5]\d{8}$/)
    .withMessage("Invalid Egyptian mobile number (e.g., 0101234567)")
    .customSanitizer((input) => {
      return input.startsWith("+20") ? input : `+20${input}`;
    })
    .custom(async (input) => {
      await checkExistingUser({ phone: input }, "Phone already in use");
    }),
  // Password
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain uppercase and lowercase letters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain uppercase and lowercase letters.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character."),
];
