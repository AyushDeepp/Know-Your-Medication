const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { auth, authorize, checkDoctorApproval } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', auth, authorize('doctor'), checkDoctorApproval, prescriptionController.createPrescription);
router.get('/patient', auth, authorize('patient'), prescriptionController.getPatientPrescriptions);
router.get('/doctor', auth, authorize('doctor'), prescriptionController.getDoctorPrescriptions);
router.get('/:id', auth, prescriptionController.getPrescriptionById);

module.exports = router; 