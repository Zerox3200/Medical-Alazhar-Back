import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dn6149nzx',
    api_key: process.env.CLOUDINARY_API_KEY || '729586793226188',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'tTWSJV_s1lAqIBj2OEHle-I_0EQ'
});



// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: process.env.CLOUDINARY_FOLDER || 'medical_interns',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
});

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Upload single image middleware
export const uploadSingleImage = upload.single('image');

// Upload single image with custom field name
export const uploadSingleImageWithField = (fieldName) => upload.single(fieldName);

// Upload multiple images middleware
export const uploadMultipleImages = upload.array('images', 10); // Max 10 images

// Upload to specific folder middleware
export const uploadToFolder = (folderName, fieldName = 'image') => {
    const folderStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `${process.env.CLOUDINARY_FOLDER}/${folderName}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        }
    });

    return multer({
        storage: folderStorage,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    }).single(fieldName);
};

// Flexible upload middleware that accepts any field name
export const uploadToFolderFlexible = (folderName) => {

    // Use disk storage to save files temporarily before uploading to Cloudinary
    const folderStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            const tempDir = 'uploads/temp/';
            // Create directory if it doesn't exist
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const upload = multer({
        storage: folderStorage,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });

    // Create a custom middleware that wraps the multer middleware
    return (req, res, next) => {
        // Set a timeout to detect hanging Cloudinary uploads (reduced for faster feedback)
        const uploadTimeout = setTimeout(() => {
            return next(new Error('Upload timeout - Cloudinary upload took too long'));
        }, 15000);

        // Use .fields() with proper callback handling
        const fieldsMiddleware = upload.fields([
            { name: 'courseImage', maxCount: 1 },
            { name: 'image', maxCount: 1 },
            { name: 'file', maxCount: 1 },
            { name: 'photo', maxCount: 1 },
            { name: 'banner', maxCount: 1 },
            { name: 'thumbnail', maxCount: 1 },
            { name: 'profileImage', maxCount: 1 }
        ]);

        fieldsMiddleware(req, res, async (err) => {
            clearTimeout(uploadTimeout); // Clear the timeout

            if (err) {
                return next(err);
            }

            try {
                // Upload files to Cloudinary in parallel for better performance
                if (req.files) {
                    const uploadPromises = [];
                    const filesToProcess = [];

                    // Collect all files to upload
                    for (const fieldName in req.files) {
                        if (req.files[fieldName] && req.files[fieldName].length > 0) {
                            const file = req.files[fieldName][0];
                            filesToProcess.push({ file, fieldName });
                        }
                    }

                    // Upload all files in parallel
                    for (const { file, fieldName } of filesToProcess) {
                        const uploadPromise = cloudinary.v2.uploader.upload(file.path, {
                            folder: `${process.env.CLOUDINARY_FOLDER}/${folderName}`,
                            // Optimize for speed - no transformations during upload
                            resource_type: 'auto',
                            use_filename: true,
                            unique_filename: true,
                            overwrite: false,
                            eager_async: false
                        }).then(result => {
                            // Update file object with Cloudinary data
                            file.secure_url = result.secure_url;
                            file.public_id = result.public_id;
                            file.cloudinary_url = result.secure_url;

                            // Clean up local file
                            try {
                                if (fs.existsSync(file.path)) {
                                    fs.unlinkSync(file.path);
                                }
                            } catch (cleanupError) {
                                // Silent cleanup error
                            }

                            return result;
                        });

                        uploadPromises.push(uploadPromise);
                    }

                    // Wait for all uploads to complete
                    await Promise.all(uploadPromises);
                }

                next();

            } catch (cloudinaryError) {
                return next(cloudinaryError);
            }
        });
    };
};

// Video upload middleware for large video files (up to 500MB)
export const uploadVideoToFolder = (folderName, fieldName = 'video') => {
    const videoStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `${process.env.CLOUDINARY_FOLDER}/${folderName}`,
            resource_type: 'video',
            allowed_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp'],
            transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        }
    });

    return multer({
        storage: videoStorage,
        limits: {
            fileSize: 500 * 1024 * 1024, // 500MB limit for videos
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only video files are allowed!'), false);
            }
        }
    }).single(fieldName);
};

// Flexible video upload middleware that accepts any field name
export const uploadVideoToFolderFlexible = (folderName) => {
    // Use disk storage to save files temporarily before uploading to Cloudinary
    const videoStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            const tempDir = 'uploads/temp/';
            // Create directory if it doesn't exist
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const upload = multer({
        storage: videoStorage,
        limits: {
            fileSize: 500 * 1024 * 1024, // 500MB limit for videos
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only video files are allowed!'), false);
            }
        }
    });

    // Create a custom middleware that wraps the multer middleware
    return (req, res, next) => {
        // Set a timeout to detect hanging Cloudinary uploads
        const uploadTimeout = setTimeout(() => {
            return next(new Error('Upload timeout - Cloudinary upload took too long'));
        }, 30000); // 30 seconds for videos (longer than images)

        // Use .fields() with proper callback handling
        const fieldsMiddleware = upload.fields([
            { name: 'courseVideos', maxCount: 1 },
            { name: 'video', maxCount: 1 },
            { name: 'file', maxCount: 1 },
            { name: 'videoFile', maxCount: 1 }
        ]);

        fieldsMiddleware(req, res, async (err) => {
            clearTimeout(uploadTimeout); // Clear the timeout

            if (err) {
                return next(err);
            }

            try {
                // Upload files to Cloudinary in parallel for better performance
                if (req.files) {
                    const uploadPromises = [];
                    const filesToProcess = [];

                    // Collect all files to upload
                    for (const fieldName in req.files) {
                        if (req.files[fieldName] && req.files[fieldName].length > 0) {
                            const file = req.files[fieldName][0];
                            filesToProcess.push({ file, fieldName });
                        }
                    }

                    // Upload all files in parallel
                    for (const { file, fieldName } of filesToProcess) {
                        const uploadPromise = cloudinary.v2.uploader.upload(file.path, {
                            folder: `${process.env.CLOUDINARY_FOLDER}/${folderName}`,
                            resource_type: 'video',
                            allowed_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp'],
                            // Optimize for speed - no transformations during upload
                            use_filename: true,
                            unique_filename: true,
                            overwrite: false,
                            eager_async: false
                        }).then(result => {
                            // Update file object with Cloudinary data
                            file.secure_url = result.secure_url;
                            file.public_id = result.public_id;
                            file.cloudinary_url = result.secure_url;

                            // Clean up local file
                            try {
                                if (fs.existsSync(file.path)) {
                                    fs.unlinkSync(file.path);
                                }
                            } catch (cleanupError) {
                                // Silent cleanup error
                            }

                            return result;
                        });

                        uploadPromises.push(uploadPromise);
                    }

                    // Wait for all uploads to complete
                    await Promise.all(uploadPromises);
                }

                next();

            } catch (cloudinaryError) {
                return next(cloudinaryError);
            }
        });
    };
};

// Direct upload function (for programmatic uploads)
export const uploadImageDirectly = async (filePath, options = {}) => {
    try {
        const uploadOptions = {
            folder: process.env.CLOUDINARY_FOLDER || 'medical_interns',
            resource_type: 'image',
            ...options
        };

        const result = await cloudinary.uploader.upload(filePath, uploadOptions);
        return {
            success: true,
            data: {
                public_id: result.public_id,
                url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Upload base64 image
export const uploadBase64Image = async (base64String, options = {}) => {
    try {
        const uploadOptions = {
            folder: process.env.CLOUDINARY_FOLDER || 'medical_interns',
            resource_type: 'image',
            ...options
        };

        const result = await cloudinary.uploader.upload(base64String, uploadOptions);
        return {
            success: true,
            data: {
                public_id: result.public_id,
                url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
    try {
        // If it's a full Cloudinary URL, extract the public_id
        let actualPublicId = publicId;

        if (publicId && publicId.includes('cloudinary.com')) {
            actualPublicId = extractPublicIdFromUrl(publicId);
        }

        if (!actualPublicId) {
            return {
                success: false,
                error: 'Invalid public_id or URL'
            };
        }

        const result = await cloudinary.uploader.destroy(actualPublicId);

        return {
            success: true,
            data: result,
            public_id: actualPublicId
        };
    } catch (error) {
        console.error('Error deleting image:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete video from Cloudinary
export const deleteVideo = async (publicId) => {
    try {
        // If it's a full Cloudinary URL, extract the public_id
        let actualPublicId = publicId;

        if (publicId && publicId.includes('cloudinary.com')) {
            actualPublicId = extractPublicIdFromUrl(publicId);
        }

        if (!actualPublicId) {
            return {
                success: false,
                error: 'Invalid public_id or URL'
            };
        }

        const result = await cloudinary.uploader.destroy(actualPublicId, { resource_type: 'video' });

        return {
            success: true,
            data: result,
            public_id: actualPublicId
        };
    } catch (error) {
        console.error('Error deleting video:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const extractPublicIdFromUrl = (url) => {
    try {
        if (url.includes('cloudinary.com')) {
            const uploadIndex = url.indexOf('/upload/');
            if (uploadIndex !== -1) {
                const pathAfterUpload = url.substring(uploadIndex + 8);

                const parts = pathAfterUpload.split('/');

                let publicIdParts = [];
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i].startsWith('v') && /^v\d+$/.test(parts[i])) {
                        continue;
                    }
                    if (i === parts.length - 1) {
                        const lastPart = parts[i];
                        const dotIndex = lastPart.lastIndexOf('.');
                        if (dotIndex !== -1) {
                            publicIdParts.push(lastPart.substring(0, dotIndex));
                        } else {
                            publicIdParts.push(lastPart);
                        }
                    } else {
                        publicIdParts.push(parts[i]);
                    }
                }

                return publicIdParts.join('/');
            }
        }

        return url;
    } catch (error) {
        console.error('Error extracting public_id from URL:', error);
        return null;
    }
};

// Get image info
export const getImageInfo = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Generate signed upload preset (for client-side uploads)
export const generateUploadSignature = (params = {}) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp: timestamp,
            ...params
        },
        process.env.CLOUDINARY_API_SECRET || 'tTWSJV_s1lAqIBj2OEHle-I_0EQ'
    );

    return {
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY || '729586793226188',
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dn6149nzx'
    };
};

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 500MB for videos, 5MB for images.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 files.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.'
            });
        }
    }

    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (error.message === 'Only video files are allowed!') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: error.message || 'Upload failed. Please try again.'
    });
};

// Success response middleware
export const handleUploadSuccess = (req, res, next) => {
    // Handle .fields() structure - req.files is an object with field names as keys
    if (req.files) {
        // Find the first file from any field
        let firstFile = null;
        for (const fieldName in req.files) {
            if (req.files[fieldName] && req.files[fieldName].length > 0) {
                firstFile = req.files[fieldName][0];
                break;
            }
        }

        if (firstFile) {
            // Use real Cloudinary data from the upload
            req.uploadedFile = {
                public_id: firstFile.public_id || firstFile.originalname,
                url: firstFile.secure_url || firstFile.cloudinary_url,
                width: null,
                height: null,
                format: firstFile.mimetype?.split('/')[1] || 'unknown',
                size: firstFile.size || 0,
                duration: null,
                resource_type: 'image',
                originalname: firstFile.originalname,
                mimetype: firstFile.mimetype
            };
        }
    }

    // Handle single file (for backward compatibility)
    if (req.file) {
        req.uploadedFile = {
            public_id: req.file.public_id || req.file.originalname,
            url: req.file.secure_url || req.file.cloudinary_url,
            width: null,
            height: null,
            format: req.file.mimetype?.split('/')[1] || 'unknown',
            size: req.file.size || 0,
            duration: null,
            resource_type: 'image',
            originalname: req.file.originalname,
            mimetype: req.file.mimetype
        };
    }

    next();
};

export default {
    uploadSingleImage,
    uploadMultipleImages,
    uploadToFolder,
    uploadVideoToFolder,
    uploadVideoToFolderFlexible,
    uploadImageDirectly,
    uploadBase64Image,
    deleteImage,
    deleteVideo,
    getImageInfo,
    generateUploadSignature,
    handleUploadError,
    handleUploadSuccess
};

export const uploadToCloudinary = (folderName, fieldName = "file") => {
    return [
        upload.single(fieldName), // handles single file upload
        async (req, res, next) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: "No file uploaded" });
                }

                // Upload file to Cloudinary
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: `${process.env.CLOUDINARY_FOLDER}/${folderName}`,
                    transformation: [
                        { width: 1000, height: 1000, crop: "limit" },
                        { quality: "auto" },
                        { fetch_format: "auto" },
                    ],
                });

                // Attach secure_url to request for next function
                req.file.secure_url = result.secure_url;
                req.file.public_id = result.public_id;

                // ✅ Cleanup local file after upload
                fs.unlinkSync(req.file.path);

                next();
            } catch (error) {
                console.error("Cloudinary upload error:", error);
                return res.status(500).json({ error: "Upload to Cloudinary failed" });
            }
        },
    ];
};