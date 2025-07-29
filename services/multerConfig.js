import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userFolderName = req.user.email?.split("@")[0];
    const uploadPath = `uploads/images/${userFolderName}/${file.fieldname}`;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdir(uploadPath, { recursive: true }, (error, path) => {
        if (error) return cb(error);
        cb(null, uploadPath);
      });
    } else {
      cb(null, uploadPath);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueFilename =
      Date.now() + "-" + file.fieldname + "-" + uuidv4() + ext;
    cb(null, uniqueFilename);
  },
});

const filter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpg", "image/jpeg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, and PNG images are allowed"), false);
  }
};

const multerConfig = multer({
  storage: storage,
  fileFilter: filter,
  limits: 2 * 1024 * 1024,
});

export default multerConfig;
