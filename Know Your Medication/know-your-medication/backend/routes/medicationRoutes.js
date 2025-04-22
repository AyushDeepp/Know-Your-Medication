const express = require('express');
const medicationController = require('../controllers/medicationController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/search', medicationController.searchMedications);
router.get('/:id', medicationController.getMedicationById);

// Auth routes
router.post('/check-interactions', auth, medicationController.checkInteractions);

// Admin routes
router.post('/', auth, authorize('admin'), medicationController.addMedication);

module.exports = router; 