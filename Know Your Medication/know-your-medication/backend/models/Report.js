const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Making it optional since patients can upload their own reports
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
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema); 