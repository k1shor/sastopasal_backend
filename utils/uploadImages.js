const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

const isCloudinaryConfigured = () =>
    Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

const removeLocalFile = (filePath) => {
    fs.unlink(filePath, (error) => {
        if (error) {
            console.log(`Could not delete temporary upload ${filePath}:`, error.message);
        }
    });
};

// Upload one file to Cloudinary when credentials are present. Without
// credentials the file stays in public/uploads and is served from /uploads.
const uploadImage = async (file, folder) => {
    if (!file) {
        return "";
    }

    if (!isCloudinaryConfigured()) {
        return `/uploads/${path.basename(file.path)}`;
    }

    try {
        const result = await cloudinary.uploader.upload(file.path, { folder });
        removeLocalFile(file.path);
        return result.secure_url;
    } catch (error) {
        removeLocalFile(file.path);
        throw error;
    }
};

const uploadImages = async (files, folder) => {
    if (!files || files.length === 0) {
        return [];
    }

    const imageUrls = [];

    for (const file of files) {
        imageUrls.push(await uploadImage(file, folder));
    }

    return imageUrls;
};

// Multer exposes req.file for .single() and req.files as either an array
// (.array()) or an object of arrays (.fields()).
const collectUploadedFiles = (req) => {
    if (Array.isArray(req.files)) {
        return req.files;
    }

    if (req.files && typeof req.files === "object") {
        return Object.values(req.files).flat();
    }

    return req.file ? [req.file] : [];
};

module.exports = {
    uploadImage,
    uploadImages,
    collectUploadedFiles
};
