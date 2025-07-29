import { check } from "express-validator";
import httpStatusText from "../../utils/httpStatusText.js";

export const quizValidation = [
  // Question text
  check("questions.questionText")
    .notEmpty()
    .trim()
    .withMessage("Question text must be provided")
    .isAlphanumeric("en-US", { ignore: " -?!.:" })
    .withMessage("Question text can only contain these characters => -?!.:"),
  // Options
  check("questions.options")
    .notEmpty()
    .trim()
    .withMessage("Options must be provided")
    .isArray({ min: 4 })
    .withMessage("Questions options must be at least 4 options"),
  // Correct answer
  check("questions.correctAnswer")
    .notEmpty()
    .trim()
    .withMessage("Correct answer must be provided")
    .custom((input, { req }) => {
      if (!req.body.questions?.options?.includes(input)) {
        throw new Error("Correct answer must be one of the options");
      }
      return true;
    }),
];
