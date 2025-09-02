import { check } from "express-validator";

const courseValidation = [
  // Title
  check("title")
    .notEmpty()
    .trim()
    .withMessage("Title must be provided")
    .isAlphanumeric("en-US", { ignore: " " })
    .withMessage("Title can only contain letters and numbers"),
  // Description
  check("description")
    .notEmpty()
    .trim()
    .withMessage("Description must be provided")
    .isAlphanumeric("en-US", { ignore: " " })
    .withMessage("Description can only contain letters and numbers"),
  // Mentor
  check("mentor")
    .notEmpty()
    .trim()
    .withMessage("Mentor must be provided")
    .isLength({ min: 5 })
    .withMessage("Mentor name must be at least 5 letters")
    .isAlpha("en-US", { ignore: [" ", "."] })
    .withMessage("Mentor can only contain letters"),
  // Course image (optional)
  check("courseImage")
    .optional()
    .trim()
    .isURL()
    .withMessage("This url is not valid"),
  // Tags
  check("tags")
    .isArray()
    .withMessage("Tags must be an array")
    .notEmpty()
    .withMessage("Please, add at least one tag"),
];

export default courseValidation;
