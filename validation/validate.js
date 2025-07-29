import { validationResult } from "express-validator";
import httpStatusText from "../utils/httpStatusText.js";

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const firstError = errors.array()[0];

    const statusCode = firstError.msg.statusCode || 400;
    const statusText = firstError.msg.statusText || httpStatusText.ERROR;
    const errorMessage = firstError.msg.message || firstError.msg;

    res.status(statusCode).json({
      status: statusText,
      code: statusCode,
      message: errorMessage,
      field: firstError.path,
    });
  };
};

export default validate;
