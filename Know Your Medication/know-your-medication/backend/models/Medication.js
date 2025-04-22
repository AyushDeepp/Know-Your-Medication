const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  dosageForm: {
    type: String,
    trim: true
  },
  strength: {
    type: String,
    trim: true
  },
  composition: {
    type: String,
    trim: true
  },
  indications: {
    type: String,
    trim: true
  },
  contraindications: {
    type: String,
    trim: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  interactions: {
    type: String,
    trim: true
  },
  usage: {
    type: String,
    trim: true
  },
  storage: {
    type: String,
    trim: true
  },
  rxcui: {
    type: String,
    trim: true,
    index: true
  },
  classification: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
medicationSchema.index({ name: 'text', genericName: 'text' });

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = Medication;