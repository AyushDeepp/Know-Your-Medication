const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Generate reset token for password reset
const generateResetToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Set up nodemailer transporter with fallback for missing credentials
let transporter;
try {
  // Check if email credentials are provided
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    console.warn('Email credentials missing in .env file. Email functionality will be simulated.');
    // Create a mock transporter that logs emails instead of sending
    transporter = {
      sendMail: (mailOptions) => {
        console.log('EMAIL WOULD BE SENT:', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: mailOptions.text || 'Email body would appear here',
        });
        return Promise.resolve({ response: 'Simulated email success' });
      }
    };
  }
} catch (error) {
  console.error('Error setting up email transporter:', error);
  // Fallback mock transporter
  transporter = {
    sendMail: () => Promise.resolve({ response: 'Simulated email success' })
  };
}

// Register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, ...profileData } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      profile: profileData
    });
    
    await user.save();
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if doctor is approved
    if (user.role === 'doctor' && !user.isApproved) {
      return res.status(403).json({ 
        message: 'Your account is pending approval',
        isApproved: false
      });
    }
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('doctors', 'name email profile.specialization')
      .populate('patients', 'name email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, ...profileData } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.name = name || user.name;
    user.email = email || user.email;
    
    // Update profile fields
    user.profile = {
      ...user.profile,
      ...profileData
    };
    
    await user.save();
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If the user already has a profile picture, delete the old one
    if (user.profilePicture) {
      try {
        // Extract the filename from the path
        const oldFilePath = path.join(__dirname, '../../', user.profilePicture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (err) {
        console.error('Error deleting old profile picture:', err);
        // Continue even if deletion fails
      }
    }
    
    // Set the new profile picture
    user.profilePicture = req.file.path;
    await user.save();
    
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete profile picture
const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.profilePicture) {
      return res.status(400).json({ message: 'No profile picture to delete' });
    }
    
    // Delete the file
    try {
      const filePath = path.join(__dirname, '../../', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting profile picture file:', err);
      // Continue even if file deletion fails
    }
    
    // Update user data
    user.profilePicture = '';
    await user.save();
    
    res.status(200).json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get patient by ID
const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if the patient exists
    const patient = await User.findById(patientId)
      .select('-password')
      .populate('doctors', 'name email profile.specialization');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check permissions - only the patient, their doctors, or an admin can access details
    const currentUserId = req.user._id.toString();
    
    if (
      currentUserId !== patientId && 
      !patient.doctors.some(doctor => doctor._id.toString() === currentUserId) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to view this patient\'s details' });
    }
    
    res.status(200).json(patient);
  } catch (error) {
    console.error('Error in getPatientById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add emergency contact
const addEmergencyContact = async (req, res) => {
  try {
    const { name, relationship, phoneNumber, isPrimary } = req.body;
    
    if (!name || !relationship || !phoneNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.profile.emergencyContacts) {
      user.profile.emergencyContacts = [];
    }
    
    // If this contact is primary, set all other contacts to non-primary
    if (isPrimary) {
      user.profile.emergencyContacts.forEach(contact => {
        contact.isPrimary = false;
      });
    }
    
    // Add the new contact
    user.profile.emergencyContacts.push({
      name,
      relationship,
      phoneNumber,
      isPrimary: isPrimary || false
    });
    
    // Set this as primary if it's the first contact
    if (user.profile.emergencyContacts.length === 1) {
      user.profile.emergencyContacts[0].isPrimary = true;
    }
    
    await user.save();
    
    res.status(200).json({
      emergencyContacts: user.profile.emergencyContacts
    });
  } catch (error) {
    console.error('Error in addEmergencyContact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update emergency contact
const updateEmergencyContact = async (req, res) => {
  try {
    const { contactId, name, relationship, phoneNumber, isPrimary } = req.body;
    
    if (!contactId) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.profile.emergencyContacts || user.profile.emergencyContacts.length === 0) {
      return res.status(404).json({ message: 'No emergency contacts found' });
    }
    
    // Find the contact to update
    const contactIndex = user.profile.emergencyContacts.findIndex(
      contact => contact._id.toString() === contactId
    );
    
    if (contactIndex === -1) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }
    
    // If this contact is being set as primary, set all other contacts to non-primary
    if (isPrimary) {
      user.profile.emergencyContacts.forEach(contact => {
        contact.isPrimary = false;
      });
    }
    
    // Update the contact
    if (name) user.profile.emergencyContacts[contactIndex].name = name;
    if (relationship) user.profile.emergencyContacts[contactIndex].relationship = relationship;
    if (phoneNumber) user.profile.emergencyContacts[contactIndex].phoneNumber = phoneNumber;
    if (isPrimary !== undefined) user.profile.emergencyContacts[contactIndex].isPrimary = isPrimary;
    
    await user.save();
    
    res.status(200).json({
      emergencyContacts: user.profile.emergencyContacts
    });
  } catch (error) {
    console.error('Error in updateEmergencyContact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete emergency contact
const deleteEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    
    if (!contactId) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.profile.emergencyContacts || user.profile.emergencyContacts.length === 0) {
      return res.status(404).json({ message: 'No emergency contacts found' });
    }
    
    // Find the contact to delete
    const contactIndex = user.profile.emergencyContacts.findIndex(
      contact => contact._id.toString() === contactId
    );
    
    if (contactIndex === -1) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }
    
    // Check if it's a primary contact
    const isPrimary = user.profile.emergencyContacts[contactIndex].isPrimary;
    
    // Remove the contact
    user.profile.emergencyContacts.splice(contactIndex, 1);
    
    // If deleted contact was primary and there are other contacts, set the first one as primary
    if (isPrimary && user.profile.emergencyContacts.length > 0) {
      user.profile.emergencyContacts[0].isPrimary = true;
    }
    
    await user.save();
    
    res.status(200).json({
      emergencyContacts: user.profile.emergencyContacts
    });
  } catch (error) {
    console.error('Error in deleteEmergencyContact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update profile medical information
const updateMedicalInfo = async (req, res) => {
  try {
    console.log('Received medical info update:', JSON.stringify(req.body));
    
    const { 
      bloodGroup, 
      weight, 
      height, 
      allergiesText, 
      chronicConditions, 
      currentMedications, 
      familyHistory, 
      surgicalHistory 
    } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize profile if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }
    
    // Update medical information
    if (bloodGroup) user.profile.bloodGroup = bloodGroup;
    
    // Update numeric fields - use strict comparison to allow 0 values
    if (weight !== undefined) user.profile.weight = weight;
    if (height !== undefined) user.profile.height = height;
    
    // Handle text fields - use strict comparison to allow empty strings
    if (allergiesText !== undefined) user.profile.allergiesText = allergiesText;
    if (chronicConditions !== undefined) user.profile.chronicConditions = chronicConditions;
    if (currentMedications !== undefined) user.profile.currentMedications = currentMedications;
    if (familyHistory !== undefined) user.profile.familyHistory = familyHistory;
    if (surgicalHistory !== undefined) user.profile.surgicalHistory = surgicalHistory;
    
    console.log('Saving user profile with updated medical info:', JSON.stringify(user.profile));
    await user.save();
    
    res.status(200).json({
      profile: user.profile
    });
  } catch (error) {
    console.error('Error in updateMedicalInfo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ 
      role: 'doctor',
      isApproved: true
    })
    .select('name email profile.specialization');
    
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get pending doctor requests (for admin)
const getPendingDoctorRequests = async (req, res) => {
  try {
    const pendingDoctors = await User.find({
      role: 'doctor',
      isApproved: false
    })
    .select('name email profile createdAt');
    
    res.status(200).json(pendingDoctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve or reject doctor (for admin)
const approveDoctorRequest = async (req, res) => {
  try {
    const { doctorId, isApproved } = req.body;
    
    const doctor = await User.findById(doctorId);
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    doctor.isApproved = isApproved;
    
    await doctor.save();
    
    res.status(200).json({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      isApproved: doctor.isApproved
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all patients (for doctor or admin)
const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('name email profile');
    
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add patient to doctor's list
const addPatientToDoctor = async (req, res) => {
  try {
    const { patientId, email } = req.body;
    const doctorId = req.user._id;
    
    let patient;
    
    // Find patient by ID or email
    if (patientId) {
      patient = await User.findById(patientId);
    } else if (email) {
      patient = await User.findOne({ email, role: 'patient' });
    } else {
      return res.status(400).json({ message: 'Either patientId or email is required' });
    }
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if patient is already added
    if (doctor.patients.includes(patient._id)) {
      return res.status(400).json({ message: 'Patient already added' });
    }
    
    // Add patient to doctor's list
    doctor.patients.push(patient._id);
    
    // Add doctor to patient's list
    patient.doctors.push(doctorId);
    
    await Promise.all([doctor.save(), patient.save()]);
    
    res.status(200).json({
      message: 'Patient added successfully',
      doctorId,
      patientId: patient._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get doctor's patients
const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    const doctor = await User.findById(doctorId)
      .populate('patients', 'name email profile');
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.status(200).json(doctor.patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get patient's doctors
const getPatientDoctors = async (req, res) => {
  try {
    const patientId = req.user._id;
    
    const patient = await User.findById(patientId)
      .populate('doctors', 'name email profile.specialization');
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.status(200).json(patient.doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users (for admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort('role');
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove patient from doctor's list
const removePatientFromDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;
    
    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if patient is in doctor's list
    if (!doctor.patients.includes(patientId)) {
      return res.status(400).json({ message: 'Patient is not in your list' });
    }
    
    // Remove patient from doctor's list
    doctor.patients = doctor.patients.filter(id => id.toString() !== patientId);
    
    // Remove doctor from patient's list
    patient.doctors = patient.doctors.filter(id => id.toString() !== doctorId.toString());
    
    await Promise.all([doctor.save(), patient.save()]);
    
    res.status(200).json({
      message: 'Patient removed successfully',
      doctorId,
      patientId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user and exclude password
    const user = await User.findById(userId)
      .select('-password')
      .populate('doctors', 'name email profile.specialization')
      .populate('patients', 'name email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // For security, we may want to limit what information is returned based on user role
    // For now, just return the full user object
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a user - admin only
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete users' });
    }
    
    // Check if trying to delete self
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    
    // Find and delete the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If deleting a doctor, remove them from all patients
    if (user.role === 'doctor') {
      // Find all patients that have this doctor
      const patients = await User.find({ doctors: userId });
      
      // Remove doctor from each patient
      for (const patient of patients) {
        patient.doctors = patient.doctors.filter(
          id => id.toString() !== userId
        );
        await patient.save();
      }
    }
    
    // If deleting a patient, remove them from all doctors
    if (user.role === 'patient') {
      // Find all doctors that have this patient
      const doctors = await User.find({ patients: userId });
      
      // Remove patient from each doctor
      for (const doctor of doctors) {
        doctor.patients = doctor.patients.filter(
          id => id.toString() !== userId
        );
        await doctor.save();
      }
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forgot password - request reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate reset token and set expiry
    const resetToken = generateResetToken();
    const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpiry;
    await user.save();

    // Create reset URL - check if FRONTEND_URL is available, otherwise use a fallback
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    
    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@example.com',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your Know Your Medication account.</p>
        <p>Please click on the following link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link is valid for 1 hour.</p>
        <p>If you did not request this reset, please ignore this email.</p>
      `
    };

    try {
      // Send email (real or simulated)
      await transporter.sendMail(mailOptions);
      
      // For development, log the reset token when using mock transporter
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log(`Development mode: Reset token for ${email}: ${resetToken}`);
        console.log(`Use this URL to reset: ${resetUrl}`);
      }
      
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      // Still return success since the token was created
      // In a production app, you might want to handle this differently
      res.status(200).json({ 
        message: 'Password reset requested. If the email exists in our system, you will receive a reset link.',
        devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset password - validate token and update password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Find user by reset token and check if token is expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Prepare confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@example.com',
      to: user.email,
      subject: 'Password Reset Successful',
      html: `
        <h1>Password Reset Complete</h1>
        <p>Your password has been successfully reset.</p>
        <p>If you did not make this change, please contact support immediately.</p>
      `
    };

    try {
      // Send confirmation email (real or simulated)
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      // Log error but don't fail the request since password was reset successfully
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserById,
  getPatientById,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  updateMedicalInfo,
  getAllDoctors,
  getPendingDoctorRequests,
  approveDoctorRequest,
  getAllPatients,
  addPatientToDoctor,
  getDoctorPatients,
  getPatientDoctors,
  getAllUsers,
  removePatientFromDoctor,
  deleteUser,
  uploadProfilePicture,
  deleteProfilePicture,
  forgotPassword,
  resetPassword
}; 