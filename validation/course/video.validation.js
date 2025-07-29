import { check } from "express-validator";
import Video from "../../models/course/video.models.js";

export const videoValidation = [
  // Title
  check("title")
    .notEmpty()
    .trim()
    .withMessage("Title must be provided")
    .isAlphanumeric("en-US", { ignore: " ?!.-" })
    .withMessage("Title can only contain letters and numbers"),
  // Video URL
  check("url")
    .notEmpty()
    .trim()
    .withMessage("Video url must be provided")
    .isURL()
    .withMessage("This url is not valid")
    .custom(async (input) => {
      const video = await Video.findOne({ url: input }).lean();
      if (video) throw new Error("This video is already uploaded");
      return true;
    }),
  // Duration
  check("duration")
    .notEmpty()
    .trim()
    .withMessage("Duration is required")
    .isNumeric()
    .withMessage("Duration can only be a nubmer"),
];
