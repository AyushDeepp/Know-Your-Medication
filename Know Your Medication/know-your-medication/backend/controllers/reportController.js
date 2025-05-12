const Report = require('../models/Report');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../config/cloudinary');

// Upload a new report
const uploadReport = async (req, res) => {
  try {
    const { title, reportType } = req.body;
    const patientId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Create a new report with Cloudinary URL
    const report = new Report({
      patientId,
      title,
      reportType,
      fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
      fileName: req.file.originalname,
      filePath: req.file.path, // Cloudinary URL
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.name,
      reportId: 'REP-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    });
    
    await report.save();
    
    res.status(201).json({
      success: true,
      report: {
        _id: report._id,
        title: report.title,
        reportType: report.reportType,
        filePath: report.filePath,
        createdAt: report.createdAt,
        reportId: report.reportId,
        uploadedBy: report.uploadedBy
      }
    });
  } catch (error) {
    console.error('Error uploading report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reports for a user
const getReports = async (req, res) => {
  try {
    let reports;
    if (req.user.role === 'patient') {
      reports = await Report.find({ patientId: req.user._id })
        .populate('patientId', 'name')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'doctor') {
      reports = await Report.find({ doctorId: req.user._id })
        .populate('patientId', 'name')
        .sort({ createdAt: -1 });
    } else {
      reports = await Report.find()
        .populate('patientId', 'name')
        .populate('doctorId', 'name')
        .sort({ createdAt: -1 });
    }

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single report
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has permission to view this report
    if (req.user.role === 'patient' && !report.patientId._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a report
const updateReport = async (req, res) => {
  try {
    const { title, reportType } = req.body;
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has permission to update this report
    if (!report.patientId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    // If new file is uploaded, delete old file from Cloudinary
    if (req.file) {
      // Extract public_id from Cloudinary URL
      const publicId = report.filePath.split('/').slice(-1)[0].split('.')[0];
      await cloudinary.uploader.destroy(publicId);

      report.filePath = req.file.path;
      report.fileName = req.file.originalname;
      report.fileSize = req.file.size;
      report.mimeType = req.file.mimetype;
      report.fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'image';
    }

    report.title = title || report.title;
    report.reportType = reportType || report.reportType;

    await report.save();

    res.status(200).json({
      success: true,
      report: {
        _id: report._id,
        title: report.title,
        reportType: report.reportType,
        filePath: report.filePath,
        updatedAt: report.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a report
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has permission to delete this report
    if (!report.patientId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    // Delete file from Cloudinary
    const publicId = report.filePath.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    // Delete report from database
    await report.remove();

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
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
      report.patientId.toString() === userId.toString();
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to download this report' });
    }
    
    // Redirect to Cloudinary URL for download
    res.redirect(report.filePath);
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
      report.patientId.toString() === userId.toString();
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to view this report' });
    }
    
    // Redirect to Cloudinary URL for viewing
    res.redirect(report.filePath);
  } catch (error) {
    console.error('Error in viewReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  uploadReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  getPatientReports,
  getDoctorReports,
  downloadReport,
  viewReport
}; 