import Admin from "../models/admin/admin.model.js";
import httpStatusText from "../utils/httpStatusText.js";
import { ErrorCatch } from "../utils/appError.js";
import { deleteImage } from "../services/cloudnairyUpload.js";


const checkAdminAndCleanup = ErrorCatch(async (req, res, next) => {

    if (req.user.role !== "admin") {
        if (req.uploadedFile && req.uploadedFile.public_id) {
            try {
                await deleteImage(req.uploadedFile.public_id);
            } catch (error) {
                console.error('Error cleaning up image from Cloudinary:', error);
            }
        }

        if (req.uploadedFiles && req.uploadedFiles.length > 0) {
            for (const file of req.uploadedFiles) {
                if (file.public_id) {
                    try {
                        await deleteImage(file.public_id);
                    } catch (error) {
                        console.error('Error cleaning up image from Cloudinary:', error);
                    }
                }
            }
        }

        return res.status(403).json({
            status: httpStatusText.FORBIDDEN,
            code: 403,
            message: "You are not authorized to perform this action. Uploaded image has been removed.",
        });
    }

    next();
});

export default checkAdminAndCleanup;
