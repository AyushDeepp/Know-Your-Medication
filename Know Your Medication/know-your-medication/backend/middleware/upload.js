const { uploadProfile, uploadReport } = require('../config/cloudinary');
const multer = require('multer');

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for reports
const MAX_PROFILE_SIZE = 5 * 1024 * 1024; // 5MB for profile pictures

// File type validation
const validateFileType = (req, file, cb) => {
  // For profile pictures
  if (req.path.includes('profile')) {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
      return cb(new Error('Only JPEG, JPG, and PNG images are allowed for profile pictures'));
    }
  }
  // For reports
  else {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$|^application\/pdf$/)) {
      return cb(new Error('Only JPEG, JPG, PNG images and PDF files are allowed for reports'));
    }
  }
  cb(null, true);
};

// File size validation
const validateFileSize = (req, file, cb) => {
  const maxSize = req.path.includes('profile') ? MAX_PROFILE_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    return cb(new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`));
  }
  cb(null, true);
};

// Create multer instances with validation
const profileUpload = multer({
  storage: uploadProfile.storage,
  fileFilter: validateFileType,
  limits: { fileSize: MAX_PROFILE_SIZE }
});

const reportUpload = multer({
  storage: uploadReport.storage,
  fileFilter: validateFileType,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  profileUpload,
  reportUpload,
  handleUploadError
}; 