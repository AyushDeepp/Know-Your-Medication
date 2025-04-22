const express = require('express');
const reportController = require('../controllers/reportController');
const { auth, authorize, checkDoctorApproval } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reports');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  // Accept only pdf, jpeg, jpg, and png files
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const router = express.Router();

// Protected routes
router.post('/upload', auth, authorize(['doctor', 'admin']), checkDoctorApproval, upload.single('file'), reportController.uploadReport);
router.get('/patient', auth, authorize('patient'), reportController.getPatientReports);
router.get('/doctor', auth, authorize('doctor'), reportController.getDoctorReports);
router.get('/download/:id', auth, reportController.downloadReport);
router.get('/view/:id', auth, reportController.viewReport);

module.exports = router; 