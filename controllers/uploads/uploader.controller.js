import { validationResult } from "express-validator";
import { isValidObjectId } from "mongoose";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import Intern from "../../models/intern/Intern.models.js";
import fs from "fs";
import checkIdValidity from "../../utils/checkIdValidity.js";

export const imageUploader = async (req, res, next, model, id) => {
  const user = await model.findById(id);
  if (!user)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "User not found",
    });
  const profileImage = req.file?.path.replace(/\\/g, "/");
  if (!profileImage)
    return res.status(400).json({
      status: httpStatusText.FAIL,
      code: 400,
      message: "Image is required",
    });

  if (!user.profileImage) {
    user.profileImage = profileImage;
    await user.save();
  } else {
    try {
      fs.unlinkSync(user.profileImage, (err) => {
        if (err)
          return res.status(500).json({
            status: httpStatusText.ERROR,
            code: 500,
            message: "Error deleting file",
          });
      });
      user.profileImage = profileImage;
      await user.save();
    } catch (error) {
      next(error);
    }
  }
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Image uploaded successfully",
  });
};

// NationalID Image
export const nationalIDImage = asyncWrapper(async (req, res, next) => {
  // Errors on validation Status Code
  const results = validationResult(req);
  const errors = results.array();
  if (errors.length > 0) {
    return res
      .status(400)
      .json({ status: httpStatusText.ERROR, code: 400, errors });
  }

  const { internId } = req.params;

  //   Check Intern Id Validity
  if (!isValidObjectId(internId))
    return res.status(400).json({
      status: httpStatusText.ERROR,
      code: 400,
      message: "Invalid Object ID",
    });

  const intern = await Intern.findById(internId);

  if (!intern)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "User not found",
    });

  const nationalIDImage = req.file?.path.replace(/\\/g, "/");

  if (!nationalIDImage)
    return res.status(400).json({
      status: httpStatusText.FAIL,
      code: 400,
      message: "Image is required",
    });

  if (!intern.nationalIDImage) {
    intern.nationalIDImage = nationalIDImage;
    await intern.save();
  } else {
    try {
      fs.unlinkSync(intern.nationalIDImage, (err) => {
        if (err)
          return res.status(500).json({
            status: httpStatusText.ERROR,
            code: 500,
            message: "Error deleting file",
          });
      });
      intern.nationalIDImage = nationalIDImage;
      await intern.save();
    } catch (error) {
      next(error);
    }
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Image uploaded successfully",
  });
});

// MBBCH Certificate Image
export const mbbchCertificateImage = asyncWrapper(async (req, res, next) => {
  // Errors on validation Status Code
  const results = validationResult(req);
  const errors = results.array();
  if (errors.length > 0) {
    return res
      .status(400)
      .json({ status: httpStatusText.ERROR, code: 400, errors });
  }

  const { internId } = req.params;
  checkIdValidity(internId, res);

  const intern = await Intern.findById(internId);

  if (!intern)
    return res.status(404).json({
      status: httpStatusText.ERROR,
      code: 404,
      message: "User not found",
    });

  const mbbchCertificateImage = req.file?.path.replace(/\\/g, "/");

  if (!mbbchCertificateImage)
    return res.status(400).json({
      status: httpStatusText.FAIL,
      code: 400,
      message: "Image is required",
    });

  if (!intern.mbbchCertificateImage) {
    intern.mbbchCertificateImage = mbbchCertificateImage;
    await intern.save();
  } else {
    try {
      fs.unlinkSync(intern.mbbchCertificateImage, (err) => {
        if (err)
          return res.status(500).json({
            status: httpStatusText.ERROR,
            code: 500,
            message: "Error deleting file",
          });
      });
      intern.mbbchCertificateImage = mbbchCertificateImage;
      await intern.save();
    } catch (error) {
      next(error);
    }
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Image uploaded successfully",
  });
});
