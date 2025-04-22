const LabReport = require('../models/LabReport');
const User = require('../models/User');
const Patient = require('../models/patient');
const Doctor = require('../models/doctor');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Upload a new lab report
const uploadLabReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { patientId, reportType, notes } = req.body;
    const senderId = req.user._id;
    
    // Check if the patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check if the sender is a doctor or admin
    if (req.user.role === 'doctor') {
      // Check if the patient is in the doctor's list
      const doctor = await User.findById(senderId);
      if (!doctor.patients.includes(patientId)) {
        return res.status(403).json({ 
          message: 'This patient is not in your patient list' 
        });
      }
    }
    
    // Create the lab report
    const labReport = new LabReport({
      patientId,
      senderId,
      reportType,
      reportFile: req.file.path,
      notes
    });
    
    await labReport.save();
    
    res.status(201).json(labReport);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get lab reports for a patient
const getPatientLabReports = async (req, res) => {
  try {
    const patientId = req.user._id;
    
    const labReports = await LabReport.find({ patientId })
      .populate('senderId', 'name email role')
      .sort('-createdAt');
    
    res.status(200).json(labReports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get lab reports sent by a doctor or admin
const getSenderLabReports = async (req, res) => {
  try {
    const senderId = req.user._id;
    
    const labReports = await LabReport.find({ senderId })
      .populate('patientId', 'name email')
      .sort('-createdAt');
    
    res.status(200).json(labReports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get lab report by ID
const getLabReportById = async (req, res) => {
  try {
    const labReport = await LabReport.findById(req.params.id)
      .populate('senderId', 'name email role')
      .populate('patientId', 'name email');
    
    if (!labReport) {
      return res.status(404).json({ message: 'Lab report not found' });
    }
    
    // Check if the user is authorized to view this lab report
    const userId = req.user._id;
    if (
      userId.toString() !== labReport.senderId._id.toString() && 
      userId.toString() !== labReport.patientId._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to view this lab report' });
    }
    
    res.status(200).json(labReport);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get lab reports for a specific patient (for doctor/admin view)
exports.getPatientLabReportsById = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Validate patient ID format
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID format' });
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get all lab reports for this patient
    const reports = await LabReport.find({ patientId })
      .populate('senderId', 'name email profile.specialization')
      .sort('-createdAt');

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error getting patient lab reports by admin:', error);
    res.status(500).json({ message: 'Failed to get lab reports', error: error.message });
  }
};

module.exports = {
  uploadLabReport,
  getPatientLabReports,
  getSenderLabReports,
  getLabReportById,
  getPatientLabReportsById
}; 