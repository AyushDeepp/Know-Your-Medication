const express = require('express');
const { auth, authorize, checkDoctorApproval } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const reportController = require('../controllers/reportController');
const { reportUpload, handleUploadError } = require('../middleware/upload');

// Make sure the uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const reportsDir = path.join(uploadsDir, 'reports');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

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

// Create a report schema
const reportSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  reportType: {
    type: String,
    enum: ['blood', 'urine', 'xray', 'ct', 'mri', 'ultrasound', 'other'],
    default: 'other'
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  reportId: {
    type: String,
    default: function() {
      return 'REP-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  }
}, {
  timestamps: true
});

// Create the model if it doesn't exist
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

// Basic routes
router.get('/', auth, (req, res) => {
  res.status(200).json({ message: 'Reports endpoint working' });
});

// Route for patients to get their own reports
router.get('/patient', auth, authorize('patient'), async (req, res) => {
  try {
    const patientId = req.user._id;
    
    // Find all reports for the patient and populate the doctor information
    const reports = await Report.find({ patientId })
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route for doctors to get their uploaded reports
router.get('/doctor', auth, authorize('doctor'), async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    // Find all reports uploaded by the doctor
    const reports = await Report.find({ doctorId })
      .populate('patientId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching doctor reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new route for doctors to get reports for a specific patient
router.get('/patient/:patientId', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;
    
    // If doctor, verify the patient belongs to this doctor
    if (req.user.role === 'doctor') {
      // Get the doctor document to check if the patient is in their list
      const doctor = await mongoose.model('User').findById(doctorId);
      if (!doctor.patients.includes(patientId)) {
        return res.status(403).json({ 
          message: 'This patient is not in your patient list' 
        });
      }
    }
    
    // Find all reports for the specific patient
    const reports = await Report.find({ patientId })
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to view a report (PDF or image)
router.get('/view/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const token = req.query.token;
    
    if (!token) {
      return res.status(401).send('Authentication required');
    }
    
    // Verify the token and get the user
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).send('Invalid authentication token');
    }
    
    // Get the user from the database
    const user = await mongoose.model('User').findById(decodedToken.id);
    if (!user) {
      return res.status(401).send('User not found');
    }
    
    // Find the report
    const report = await Report.findById(reportId).populate('patientId doctorId');
    
    if (!report) {
      return res.status(404).send('Report not found');
    }
    
    // Check if the user has permission to view this report
    const canView = 
      user.role === 'admin' || 
      (user.role === 'doctor' && report.doctorId._id.equals(user._id)) ||
      (user.role === 'patient' && report.patientId._id.equals(user._id));
    
    if (!canView) {
      return res.status(403).send('You are not authorized to view this report');
    }
    
    // Serve the file
    return res.sendFile(path.resolve(report.filePath));
  } catch (error) {
    console.error('Error viewing report:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// Route to download a report
router.get('/download/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify the token and get the user
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    
    // Get the user from the database
    const user = await mongoose.model('User').findById(decodedToken.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Find the report
    const report = await Report.findById(reportId).populate('patientId doctorId');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if the user has permission to download this report
    const canDownload = 
      user.role === 'admin' || 
      (user.role === 'doctor' && report.doctorId._id.equals(user._id)) ||
      (user.role === 'patient' && report.patientId._id.equals(user._id));
    
    if (!canDownload) {
      return res.status(403).json({ message: 'You are not authorized to download this report' });
    }
    
    // Download the file
    return res.download(path.resolve(report.filePath), `${report.title}.${report.fileType === 'pdf' ? 'pdf' : 'jpg'}`);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Protected routes with error handling
router.post('/', 
  auth, 
  authorize('patient', 'doctor', 'admin'), 
  reportUpload.single('file'),
  handleUploadError,
  reportController.uploadReport
);

// Get all reports
router.get('/', auth, reportController.getReports);

// Get a single report
router.get('/:reportId', auth, reportController.getReportById);

// Update a report
router.put('/:reportId', 
  auth, 
  authorize('patient', 'doctor', 'admin'), 
  reportUpload.single('file'),
  handleUploadError,
  reportController.updateReport
);

// Delete a report
router.delete('/:reportId', 
  auth, 
  authorize('patient', 'doctor', 'admin'), 
  reportController.deleteReport
);

// Get patient's reports
router.get('/patient/reports', auth, authorize('patient'), reportController.getPatientReports);

// Get doctor's uploaded reports
router.get('/doctor/reports', auth, authorize('doctor'), reportController.getDoctorReports);

// View and download routes
router.get('/view/:id', auth, reportController.viewReport);
router.get('/download/:id', auth, reportController.downloadReport);

module.exports = router; 