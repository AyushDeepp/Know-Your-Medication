const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'LAB-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    trim: true,
    required: true
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  reportFile: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const LabReport = mongoose.model('LabReport', labReportSchema);

module.exports = LabReport; 