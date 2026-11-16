const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDirectory = path.join(__dirname, "..", "public", "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        const extname = path.extname(file.originalname);
        const basename = path
            .basename(file.originalname, extname)
            .replace(/[^a-zA-Z0-9_-]/g, "");

        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(null, `${file.fieldname}-${basename}-${uniqueSuffix}${extname}`);
    }
});

const fileFilter = function (req, file, cb) {
    const allowedExtensions = /jpeg|jpg|png|webp|gif/;
    const allowedMimeTypes = /image\/(jpeg|jpg|png|webp|gif)/;

    const isValidExtension = allowedExtensions.test(
        path.extname(file.originalname).toLowerCase()
    );
    const isValidMimeType = allowedMimeTypes.test(file.mimetype);

    if (isValidExtension && isValidMimeType) {
        return cb(null, true);
    }

    cb(new Error("Only image files (jpeg, jpg, png, webp, gif) are allowed."));
};

module.exports = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
