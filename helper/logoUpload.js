const multer = require('multer');
const path = require('path');

// Define storage for brand logo images
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save uploaded logo to the 'brand-logo' folder
        cb(null, path.join(__dirname, "../Public/brand-logo"));
    },
    filename: (req, file, cb) => {
        // Generate a unique filename using timestamp and original file name
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// File filter to validate image types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
};

// Multer upload configuration
const upload = multer({
    storage: logoStorage,
    fileFilter
});

module.exports = upload;
