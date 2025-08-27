import Admin from "../models/admin/admin.model.js";
import httpStatusText from "../utils/httpStatusText.js";
import { ErrorCatch } from "../utils/appError.js";
import { deleteVideo } from "../services/cloudnairyUpload.js";

const checkAdminAndCleanupVideo = ErrorCatch(async (req, res, next) => {
    const { id } = req.user;

    const admin = await Admin.findOne({ _id: id });

    if (!admin) {
        // User is not admin, cleanup the uploaded video from Cloudinary
        if (req.uploadedFile && req.uploadedFile.public_id) {
            try {
                await deleteVideo(req.uploadedFile.public_id);
                console.log(`Cleaned up unauthorized video upload: ${req.uploadedFile.public_id}`);
            } catch (error) {
                console.error('Error cleaning up video from Cloudinary:', error);
            }
        }

        // Also cleanup multiple uploaded video files if any
        if (req.uploadedFiles && req.uploadedFiles.length > 0) {
            for (const file of req.uploadedFiles) {
                if (file.public_id) {
                    try {
                        await deleteVideo(file.public_id);
                        console.log(`Cleaned up unauthorized video upload: ${file.public_id}`);
                    } catch (error) {
                        console.error('Error cleaning up video from Cloudinary:', error);
                    }
                }
            }
        }

        return res.status(403).json({
            status: httpStatusText.FORBIDDEN,
            code: 403,
            message: "You are not authorized to perform this action. Uploaded video has been removed.",
        });
    }

    next();
});

export default checkAdminAndCleanupVideo;
