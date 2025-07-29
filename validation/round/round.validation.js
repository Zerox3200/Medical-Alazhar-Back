import { check } from "express-validator";
// import Admin from "../models/admin/admin.model.js";
import Round from "../../models/round/round.models.js";
import _ from "lodash";
import httpStatusText from "../../utils/httpStatusText.js";

// Check if record existed in database
// const checkExistingRecord = async (record, msg) => {
//   const user = await Round.findOne(record);
//   if (user) {
//     throw new Error(msg);
//   }
// };

export const roundValidation = [
  // Name
  check("name").notEmpty().trim().withMessage("Name must be provided"),
  // Duration
  check("duration")
    .notEmpty()
    .withMessage("Duration must be provided")
    .isInt({ gt: 0, lt: 4 })
    .withMessage("Duration must be a positive number, 1, 2 or 3"),
  // Numeric Year
  check("numericYear")
    .notEmpty()
    .withMessage("Year must be provided")
    .isInt({ gt: 0, lt: 3 })
    .withMessage("Year must be a positive number, 1 or 2"),
  check("hospital")
    .notEmpty()
    .trim()
    .withMessage("Hospital must be provided")
    .customSanitizer((input) => _.snakeCase(input))
    .isIn(["al_hussein", "sayed_galal"])
    .withMessage("This hospital is not listed"),
];

/** Wave validation **/

export const waveValidation = [
  check("waveOrder")
    .notEmpty()
    .withMessage("Order must be provided")
    .isInt()
    .withMessage("Order must be integer")
    .custom(async (input, { req }) => {
      const isOrderDuplicated = await Round.findOne({
        _id: req.params.roundId,
        "waves.waveOrder": input,
      });
      if (isOrderDuplicated)
        throw {
          message: "This wave already exists; change the order.",
          statusCode: 409,
          statusText: httpStatusText.FAIL,
        };
    }),
  // Start Date
  check("startDate")
    .notEmpty()
    .withMessage("Start date must be provided")
    .isISO8601()
    .withMessage("Invalid date"),
  // End Date
  check("endDate")
    .notEmpty()
    .withMessage("End date must be provided")
    .isISO8601()
    .withMessage("Invalid date")
    .custom(async (input, { req }) => {
      const currentDate = new Date(req.body.startDate);
      const endDate = new Date(input);
      if (endDate <= currentDate) {
        throw new Error("End date must be greater than start date");
      }
      return true;
    }),
  // Wave Status
  check("waveStatus")
    .notEmpty()
    .withMessage("Wave status must be provided")
    .isIn(["completed", "ongoing"])
    .withMessage("Invalid status"),
  // Interns
  check("interns").isArray(),
];
