const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { getPatientPrescriptionsById } = require('../controllers/prescriptionUpdates');
const { auth, authorize, checkDoctorApproval } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', auth, authorize('doctor'), checkDoctorApproval, prescriptionController.createPrescription);
router.get('/patient', auth, authorize('patient'), prescriptionController.getPatientPrescriptions);
router.get('/doctor', auth, authorize('doctor'), prescriptionController.getDoctorPrescriptions);

// Routes that require specific IDs - make sure these come before the generic /:id route
router.get('/patient/:patientId', auth, authorize('doctor', 'admin'), getPatientPrescriptionsById);

// New route to allow patients to view their own prescriptions by ID
router.get('/my-prescriptions/:patientId', auth, authorize('patient'), async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const userId = req.user._id;
    
    // Security check: patients can only view their own prescriptions
    if (userId.toString() !== patientId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these prescriptions' });
    }
    
    const Prescription = require('../models/Prescription');
    
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name email profile.specialization')
      .sort('-createdAt');
    
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// New route to allow admins to view any patient's prescriptions by patient ID
router.get('/admin/patient/:patientId', auth, authorize('admin'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const Prescription = require('../models/Prescription');
    const User = require('../models/User');
    
    // Check if the patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name email profile.specialization')
      .sort('-createdAt');
    
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions for admin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route for admin to get prescriptions created by a specific doctor
router.get('/doctor/:doctorId', auth, authorize('admin'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const Prescription = require('../models/Prescription');
    const User = require('../models/User');
    
    // Check if the doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const prescriptions = await Prescription.find({ doctorId })
      .populate('patientId', 'name email')
      .sort('-createdAt');
    
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Must be last to avoid conflicting with more specific routes
router.get('/:id', auth, prescriptionController.getPrescriptionById);

module.exports = router; 