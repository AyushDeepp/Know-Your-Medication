const LabReport = require('../models/LabReport');
const User = require('../models/User');

// Get lab reports for a specific patient (for doctor view)
const getPatientLabReportsById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;
    
    // Check if the patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check if the doctor is authorized (either in patient's doctors or admin)
    if (req.user.role === 'doctor') {
      const doctor = await User.findById(doctorId);
      if (!doctor.patients.includes(patientId)) {
        return res.status(403).json({ 
          message: 'This patient is not in your patient list' 
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const labReports = await LabReport.find({ patientId })
      .populate('senderId', 'name email role')
      .sort('-createdAt');
    
    res.status(200).json(labReports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getPatientLabReportsById
}; 