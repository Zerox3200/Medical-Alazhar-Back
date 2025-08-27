import Admin from "../models/admin/admin.model.js";
import Intern from "../models/intern/Intern.models.js";
import Supervisor from "../models/supervisor/supervisor.models.js";
import httpStatusText from "../utils/httpStatusText.js";
import { ErrorCatch } from "../utils/appError.js";
import { deleteImage } from "../services/cloudnairyUpload.js";

/**
 * Generic middleware to check user role and cleanup uploaded images if not authorized
 * @param {string|string[]} allowedRoles - Role(s) that are allowed to proceed
 * @returns {Function} Middleware function
 */
const checkRoleAndCleanup = (allowedRoles) => {
    return ErrorCatch(async (req, res, next) => {
        const { id } = req.user;
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Check user role by querying different models
        let userRole = null;
        let isAuthorized = false;

        // Check if user is admin
        const admin = await Admin.findOne({ _id: id });
        if (admin) {
            userRole = 'admin';
            isAuthorized = roles.includes('admin');
        }

        // Check if user is intern
        if (!userRole) {
            const intern = await Intern.findOne({ _id: id });
            if (intern) {
                userRole = 'intern';
                isAuthorized = roles.includes('intern');
            }
        }

        // Check if user is supervisor
        if (!userRole) {
            const supervisor = await Supervisor.findOne({ _id: id });
            if (supervisor) {
                userRole = 'supervisor';
                isAuthorized = roles.includes('supervisor');
            }
        }

        if (!isAuthorized) {
            // User is not authorized, cleanup the uploaded image from Cloudinary
            if (req.uploadedFile && req.uploadedFile.public_id) {
                try {
                    await deleteImage(req.uploadedFile.public_id);
                    console.log(`Cleaned up unauthorized upload by ${userRole || 'unknown'}: ${req.uploadedFile.public_id}`);
                } catch (error) {
                    console.error('Error cleaning up image from Cloudinary:', error);
                }
            }

            // Also cleanup multiple uploaded files if any
            if (req.uploadedFiles && req.uploadedFiles.length > 0) {
                for (const file of req.uploadedFiles) {
                    if (file.public_id) {
                        try {
                            await deleteImage(file.public_id);
                            console.log(`Cleaned up unauthorized upload by ${userRole || 'unknown'}: ${file.public_id}`);
                        } catch (error) {
                            console.error('Error cleaning up image from Cloudinary:', error);
                        }
                    }
                }
            }

            return res.status(403).json({
                status: httpStatusText.FORBIDDEN,
                code: 403,
                message: `Access denied. You need ${roles.join(' or ')} role to perform this action. Uploaded image has been removed.`,
                userRole: userRole || 'unknown',
                requiredRoles: roles
            });
        }

        // User is authorized, proceed to next middleware/controller
        next();
    });
};

export default checkRoleAndCleanup;
