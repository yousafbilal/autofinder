const multer = require("multer");
const path = require("path");

// Multer storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profile_pics"); // Set destination folder for profile pictures
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname); // Generate a unique file name
  },
});

// File filter to allow only image uploads
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Multer instance for profile picture uploads
const profileUpload = multer({
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5 MB
});

// Ensure the uploads/profile_pics directory exists
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads/profile_pics");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
}

module.exports = profileUpload;
