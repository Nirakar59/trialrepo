import multer from "multer";
import cloudinary from "../lib/cloudinary.js";

const ALLOWED_FORMATS = ["image/jpg", "image/jpeg", "image/png", "image/gif", "image/webp"];
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (ALLOWED_FORMATS.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error(`Invalid file type: ${file.mimetype}. Only JPG, JPEG, PNG, GIF, and WEBP are allowed.`);
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
};


const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    }
});

export const uploadToCloudinary = (fileBuffer, folder = "posts") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder,
            resource_type: "auto" 
             },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

export default upload; 
