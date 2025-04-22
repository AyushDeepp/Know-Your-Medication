const Prescription = require('../models/Prescription');
const User = require('../models/User');

// Create a new prescription
const createPrescription = async (req, res) => {
  try {
    const { patientId, symptoms, medications, notes } = req.body;
    const doctorId = req.user._id;
    
    // Check if the doctor is approved
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isApproved) {
      return res.status(403).json({ message: 'Unauthorized or not approved doctor' });
    }
    
    // Check if the patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check if the patient is in the doctor's list
    if (!doctor.patients.includes(patientId)) {
      return res.status(403).json({ 
        message: 'This patient is not in your patient list' 
      });
    }
    
    // Create the prescription with current date and time
    const prescription = new Prescription({
      doctorId,
      patientId,
      symptoms,
      medications,
      notes,
      date: new Date()
    });
    
    await prescription.save();
    
    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get prescriptions for a patient
const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user._id;
    
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name email profile.specialization')
      .sort('-createdAt');
    
    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get prescriptions created by a doctor
const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    const prescriptions = await Prescription.find({ doctorId })
      .populate('patientId', 'name email')
      .sort('-createdAt');
    
    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get prescription by ID
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name email profile.specialization')
      .populate('patientId', 'name email profile');
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check if the user is authorized to view this prescription
    const userId = req.user._id;
    if (
      userId.toString() !== prescription.doctorId._id.toString() && 
      userId.toString() !== prescription.patientId._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to view this prescription' });
    }
    
    res.status(200).json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getPrescriptionById
}; 