const express = require('express');
const userController = require('../controllers/userController');
const { auth, authorize, checkDoctorApproval } = require('../middleware/auth');
const { profileUpload } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Protected routes
router.get('/profile', auth, userController.getUserProfile);
router.put('/profile', auth, userController.updateUserProfile);
router.post('/profile-picture', auth, profileUpload.single('profilePicture'), userController.uploadProfilePicture);
router.delete('/profile-picture', auth, userController.deleteProfilePicture);
router.post('/emergency-contacts', auth, authorize('patient'), userController.addEmergencyContact);
router.put('/emergency-contacts', auth, authorize('patient'), userController.updateEmergencyContact);
router.delete('/emergency-contacts/:contactId', auth, authorize('patient'), userController.deleteEmergencyContact);
router.put('/medical-info', auth, authorize('patient'), userController.updateMedicalInfo);

// Doctor routes
router.get('/doctors', auth, userController.getAllDoctors);
router.get('/patients', auth, authorize('doctor', 'admin'), userController.getAllPatients);
router.post('/add-patient', auth, authorize('doctor'), checkDoctorApproval, userController.addPatientToDoctor);
router.get('/my-patients', auth, authorize('doctor'), checkDoctorApproval, userController.getDoctorPatients);
router.get('/my-doctors', auth, authorize('patient'), userController.getPatientDoctors);
router.delete('/remove-patient/:patientId', auth, authorize('doctor'), checkDoctorApproval, userController.removePatientFromDoctor);

// Admin routes
router.get('/all', auth, authorize('admin'), userController.getAllUsers);
router.get('/doctor-requests', auth, authorize('admin'), userController.getPendingDoctorRequests);
router.put('/approve-doctor', auth, authorize('admin'), userController.approveDoctorRequest);
router.delete('/:userId', auth, authorize('admin'), userController.deleteUser);

// Patient routes - Important to keep specific routes before generic ID route
router.get('/patients/:patientId', auth, userController.getPatientById);

// User routes - Must be last as it's a catch-all for IDs
router.get('/:userId', auth, userController.getUserById);

module.exports = router; 