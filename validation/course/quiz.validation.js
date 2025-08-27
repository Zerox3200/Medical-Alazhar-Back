import { check } from "express-validator";
import httpStatusText from "../../utils/httpStatusText.js";

export const quizValidation = [
  // Check if questions is an array
  check("questions")
    .isArray({ min: 1 })
    .withMessage("Questions must be an array with at least one question"),

  // Validate each question in the array
  check("questions.*.questionText")
    .notEmpty()
    .trim()
    .withMessage("Question text must be provided")
    .isLength({ min: 1, max: 500 })
    .withMessage("Question text must be between 1 and 500 characters"),

  // Validate options for each question
  check("questions.*.options")
    .isArray({ min: 4 })
    .withMessage("Each question must have at least 4 options"),

  // Validate that options are not empty strings
  check("questions.*.options.*")
    .notEmpty()
    .trim()
    .withMessage("Options cannot be empty"),

  // Validate correct answer for each question
  check("questions.*.correctAnswer")
    .notEmpty()
    .trim()
    .withMessage("Correct answer must be provided")
    .custom((input, { req, path }) => {
      // Extract the question index from the path (e.g., "questions.0.correctAnswer" -> 0)
      const questionIndex = path.split('.')[1];
      const question = req.body.questions[questionIndex];

      console.log(question?.options, input);
      if (!question?.options?.includes(input)) {
        throw new Error("Correct answer must be one of the options");
      }
      return true;
    }),
];
