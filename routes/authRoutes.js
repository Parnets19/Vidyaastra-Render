const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../middleware/validators'); // Assuming these are for teacher auth

// Existing OTP routes (for general OTP login, potentially for students or teachers)
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

// Existing Teacher Auth routes
router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', authController.protect, authController.getMe);

// --- NEW STUDENT AUTH ROUTES ---
// Student registration with password and dummy OTP (123456)
router.post('/student/register', authController.studentRegister);
// Student login with password (no OTP needed)
router.post('/student/login', authController.studentLogin);
// Change student password (requires student to be logged in)
router.put('/student/change-password', authController.protectStudent, authController.changeStudentPassword);

module.exports = router;
