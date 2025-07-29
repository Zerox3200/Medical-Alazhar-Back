import { isValidObjectId } from "mongoose";
import httpStatusText from "../utils/httpStatusText.js";

// Check id validitity
const checkIdValidity = (firstId, res, secondId = null) => {
  if (!isValidObjectId(firstId) || (secondId && !isValidObjectId(secondId)))
    return res.status(400).json({
      status: httpStatusText.ERROR,
      code: 400,
      message: "Invalid Object ID",
    });
};

export default checkIdValidity;
