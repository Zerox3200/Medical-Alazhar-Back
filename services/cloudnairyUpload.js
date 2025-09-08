import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dn6149nzx',
    api_key: '729586793226188',
    api_secret: 'tTWSJV_s1lAqIBj2OEHle-I_0EQ'
});



// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'medical_interns',
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
            folder: `medical_interns/${folderName}`,
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
    const folderStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `medical_interns/${folderName}`,
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
    }).any(); // Accept any field name
};

// Video upload middleware for large video files (up to 500MB)
export const uploadVideoToFolder = (folderName, fieldName = 'video') => {
    const videoStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `medical_interns/${folderName}`,
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
            console.log('Processing video file:', file.originalname, 'Type:', file.mimetype);
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
    const videoStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `medical_interns/${folderName}`,
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
            console.log('Processing video file:', file.originalname, 'Type:', file.mimetype);
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only video files are allowed!'), false);
            }
        }
    }).any(); // Accept any field name
};

// Direct upload function (for programmatic uploads)
export const uploadImageDirectly = async (filePath, options = {}) => {
    try {
        const uploadOptions = {
            folder: 'medical_interns',
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
            folder: 'medical_interns',
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

        console.log('Deleting image with public_id:', actualPublicId);
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

        console.log('Deleting video with public_id:', actualPublicId);
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
        'tTWSJV_s1lAqIBj2OEHle-I_0EQ'
    );

    return {
        timestamp,
        signature,
        api_key: '729586793226188',
        cloud_name: 'dn6149nzx'
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
    if (req.file) {
        req.uploadedFile = {
            public_id: req.file.filename,
            url: req.file.path,
            width: req.file.width,
            height: req.file.height,
            format: req.file.format,
            size: req.file.size,
            duration: req.file.duration, // For videos
            resource_type: req.file.resource_type || 'image' // 'image' or 'video'
        };
    }

    if (req.files && req.files.length > 0) {
        // Handle multiple files from flexible upload
        req.uploadedFiles = req.files.map(file => ({
            public_id: file.filename,
            url: file.path,
            width: file.width,
            height: file.height,
            format: file.format,
            size: file.size,
            duration: file.duration, // For videos
            resource_type: file.resource_type || 'image' // 'image' or 'video'
        }));

        // If only one file, also set it as uploadedFile for consistency
        if (req.files.length === 1) {
            req.uploadedFile = {
                public_id: req.files[0].filename,
                url: req.files[0].path,
                width: req.files[0].width,
                height: req.files[0].height,
                format: req.files[0].format,
                size: req.files[0].size,
                duration: req.files[0].duration, // For videos
                resource_type: req.files[0].resource_type || 'image' // 'image' or 'video'
            };
        }
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
