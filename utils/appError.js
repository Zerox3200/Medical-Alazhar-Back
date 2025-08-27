class AppError extends Error {
  constructor() {
    super();
  }

  create(message, statusCode, statusText) {
    this.message = message;
    this.statusCode = statusCode;
    this.statusText = statusText;
    return this;
  }
}

export const ErrorCatch = (controller) => {
  return (req, res, next) => {
    controller(req, res, next).catch((error) => {
      return res.json({ success: false, Message: error.message, Stack: error.stack })
    })
  }
}

export default new AppError();
