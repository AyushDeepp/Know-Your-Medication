const Report = require('../models/Report');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Upload a new lab report
const uploadReport = async (req, res) => {
  try {
    const { patientId, title, reportType } = req.body;
    const doctorId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Check if the doctor is approved (for doctor users)
    if (req.user.role === 'doctor') {
      const doctor = await User.findById(doctorId);
      if (!doctor || !doctor.isApproved) {
        return res.status(403).json({ message: 'Unauthorized or not approved doctor' });
      }
      
      // Check if the patient exists and is in the doctor's list
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== 'patient') {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      if (!doctor.patients.includes(patientId)) {
        return res.status(403).json({ 
          message: 'This patient is not in your patient list' 
        });
      }
    }
    
    // For admin users, just check if the patient exists
    if (req.user.role === 'admin') {
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== 'patient') {
        return res.status(404).json({ message: 'Patient not found' });
      }
    }
    
    // Determine file type
    const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'image';
    
    // Get the uploader's name
    const uploader = await User.findById(doctorId);
    const uploaderName = uploader ? uploader.name : 'Unknown User';
    
    // Create the report
    const report = new Report({
      doctorId,
      patientId,
      title,
      reportType,
      fileType,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: uploaderName
    });
    
    await report.save();
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Error in uploadReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reports for a patient
const getPatientReports = async (req, res) => {
  try {
    const patientId = req.user._id;
    
    const reports = await Report.find({ patientId })
      .populate('doctorId', 'name email')
      .sort('-createdAt');
    
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error in getPatientReports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reports uploaded by a doctor
const getDoctorReports = async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    const reports = await Report.find({ doctorId })
      .populate('patientId', 'name email')
      .sort('-createdAt');
    
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error in getDoctorReports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Download a report file
const downloadReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;
    
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if the user has permission to download this report
    const hasPermission = 
      req.user.role === 'admin' || 
      report.doctorId.toString() === userId.toString() || 
      report.patientId.toString() === userId.toString();
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to download this report' });
    }
    
    // Check if file exists
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Send the file for download
    res.download(report.filePath, report.fileName);
  } catch (error) {
    console.error('Error in downloadReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// View a report file
const viewReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;
    
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if the user has permission to view this report
    const hasPermission = 
      req.user.role === 'admin' || 
      report.doctorId.toString() === userId.toString() || 
      report.patientId.toString() === userId.toString();
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to view this report' });
    }
    
    // Check if file exists
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set the appropriate content type
    res.setHeader('Content-Type', report.mimeType);
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(report.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error in viewReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  uploadReport,
  getPatientReports,
  getDoctorReports,
  downloadReport,
  viewReport
}; 