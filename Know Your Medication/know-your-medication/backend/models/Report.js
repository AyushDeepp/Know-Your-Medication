const mongoose = require('mongoose');

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
  reportId: {
    type: String,
    default: function() {
      return 'REP-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  },
  uploadedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 