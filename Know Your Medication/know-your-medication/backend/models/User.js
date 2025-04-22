const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'USR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  },
  patientId: {
    type: String,
    unique: true,
    sparse: true,
    default: function() {
      return this.role === 'patient' ? 'PAT-' + Math.random().toString(36).substring(2, 10).toUpperCase() : undefined;
    }
  },
  doctorId: {
    type: String,
    unique: true,
    sparse: true,
    default: function() {
      return this.role === 'doctor' ? 'DOC-' + Math.random().toString(36).substring(2, 10).toUpperCase() : undefined;
    }
  },
  adminId: {
    type: String,
    unique: true,
    sparse: true,
    default: function() {
      return this.role === 'admin' ? 'ADM-' + Math.random().toString(36).substring(2, 10).toUpperCase() : undefined;
    }
  },
  profilePicture: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  isApproved: {
    type: Boolean,
    default: function() {
      return this.role !== 'doctor'; // only doctors need approval
    }
  },
  profile: {
    phoneNumber: String,
    address: String,
    age: Number,
    gender: String,
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown'
    },
    weight: Number,
    height: Number,
    allergiesText: String,
    chronicConditions: String,
    currentMedications: String,
    familyHistory: String,
    surgicalHistory: String,
    allergies: [{
      name: String,
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe'],
        default: 'Moderate'
      },
      notes: String
    }],
    medicalConditions: [{
      condition: String,
      diagnosedDate: Date,
      notes: String,
      isCurrent: {
        type: Boolean,
        default: true
      }
    }],
    specialization: String, // for doctors
    licenseNumber: String,  // for doctors
    emergencyContacts: [{
      name: String,
      relationship: String,
      phoneNumber: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }]
  },
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  patients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 