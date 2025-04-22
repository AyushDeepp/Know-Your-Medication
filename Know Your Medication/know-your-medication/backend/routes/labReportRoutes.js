const express = require('express');
const labReportController = require('../controllers/labReportController');
const { auth, authorize, checkDoctorApproval } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Protected routes
router.post(
  '/', 
  auth, 
  authorize('doctor', 'admin'), 
  upload.single('reportFile'), 
  labReportController.uploadLabReport
);

router.get('/patient', auth, authorize('patient'), labReportController.getPatientLabReports);
router.get('/sender', auth, authorize('doctor', 'admin'), labReportController.getSenderLabReports);
router.get('/admin/patient/:patientId', auth, authorize('admin'), labReportController.getPatientLabReportsById);
router.get('/:id', auth, labReportController.getLabReportById);

module.exports = router; 