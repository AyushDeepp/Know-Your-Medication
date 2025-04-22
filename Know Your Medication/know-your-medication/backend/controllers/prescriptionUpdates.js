const Prescription = require('../models/Prescription');
const User = require('../models/User');

// Get prescriptions for a specific patient (for doctor view)
const getPatientPrescriptionsById = async (req, res) => {
  try {
    const { patientId } = req.params;
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
    
    // Check if the patient is in the doctor's list (bypass for admin)
    if (!doctor.patients.includes(patientId) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'This patient is not in your patient list' 
      });
    }
    
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name email profile.specialization')
      .sort('-createdAt');
    
    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getPatientPrescriptionsById
}; 