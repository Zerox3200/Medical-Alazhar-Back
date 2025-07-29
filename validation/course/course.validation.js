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
  // Course image
  check("courseImage")
    .notEmpty()
    .trim()
    .withMessage("Image must be provided")
    .isURL()
    .withMessage("This url is not valid"),
  // Tags
  check("tags")
    .notEmpty()
    .trim()
    .withMessage("Please, add at least one tag")
    .isAlpha()
    .withMessage("Description can only contain letters"),
];

export default courseValidation;
