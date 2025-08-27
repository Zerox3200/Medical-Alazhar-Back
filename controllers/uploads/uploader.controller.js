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

  // Get the uploaded file info from Cloudinary middleware
  const profileImage = req.uploadedFile?.url;
  if (!profileImage)
    return res.status(400).json({
      status: httpStatusText.FAIL,
      code: 400,
      message: "Image is required",
    });

  // Update user profile image (no need to delete old file since it's on Cloudinary)
  user.profileImage = profileImage;
  await user.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Image uploaded successfully",
    data: {
      profileImage: profileImage
    }
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

  const nationalIDImage = req.uploadedFile?.url;

  if (!nationalIDImage)
    return res.status(400).json({
      status: httpStatusText.FAIL,
      code: 400,
      message: "Image is required",
    });

  // Update intern national ID image (no need to delete old file since it's on Cloudinary)
  intern.nationalIDImage = nationalIDImage;
  await intern.save();

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

  const mbbchCertificateImage = req.uploadedFile?.url;

  if (!mbbchCertificateImage)
    return res.status(400).json({
      status: httpStatusText.FAIL,
      code: 400,
      message: "Image is required",
    });

  // Update intern MBBCH certificate image (no need to delete old file since it's on Cloudinary)
  intern.mbbchCertificateImage = mbbchCertificateImage;
  await intern.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    code: 200,
    message: "Image uploaded successfully",
  });
});
