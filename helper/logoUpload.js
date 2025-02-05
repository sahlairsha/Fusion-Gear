const multer = require('multer');
const path = require('path');

const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      
        cb(null, path.join(__dirname, "../Public/brand-logo"));
    },
    filename: (req, file, cb) => {
      
        cb(null, Date.now() + "-" + file.originalname);
    }
});


const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
};


const upload = multer({
    storage: logoStorage,
    fileFilter
});

module.exports = upload;
