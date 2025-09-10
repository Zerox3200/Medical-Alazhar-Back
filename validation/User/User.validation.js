import { check } from "express-validator";

export const createNormalUserValidation = [
    // Fullname
    check("name")
        .notEmpty()
        .trim()
        .withMessage("Name must be provided")
        .matches(/^[A-Za-z-]{2,}(\s[A-Za-z-]{2,}){3,}$/)
        .withMessage("Please enter your name as in your national ID"),

    // Email
    check("email")
        .notEmpty()
        .trim()
        .withMessage("Email must be provided")
        .isEmail()
        .withMessage("Email value is not valid")
        .toLowerCase(),
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
        .withMessage("This phone is not listed")
    ,
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
    // Confirm Password
    check("confirmPassword")
        .notEmpty()
        .withMessage("Confirm Password must be provided")
        .custom((input, { req }) => {
            if (input !== req.body.password)
                throw new Error("Password not matched");
        }),
];
