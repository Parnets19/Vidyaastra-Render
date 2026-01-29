// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController'); // Adjust path
// const authMiddleware = require('../middleware/authMiddleware'); // Your authentication middleware

// Example authentication middleware (replace with your actual one)
// This middleware should ideally extract the student ID from the token
// and attach it to req.studentId for use in controllers.
const protect = (req, res, next) => {
  // For demonstration, let's assume a studentId is always available or hardcoded
  // In a real app, you'd verify a JWT token here
  req.studentId = req.headers['x-student-id'] || '654321098765432109876543'; // Replace with actual logic
  if (!req.studentId) {
    return res.status(401).json({ success: false, message: 'Not authorized, no student ID provided.' });
  }
  next();
};

router.get("/all-unfiltered", notificationController.getAllNotificationsUnfiltered)

// Routes for students to manage their notifications
router.get('/student/:studentId', protect, notificationController.getStudentNotifications);
router.put('/:id/read', protect, notificationController.markNotificationAsRead);
router.put('/student/:studentId/mark-all-read', protect, notificationController.markAllNotificationsAsRead);

// Routes for creating/deleting notifications (typically for admin/system)
// You might want a different middleware for admin access here
router.post('/', protect, notificationController.createNotification); // Example: Admin creates a notification
router.delete('/:id', protect, notificationController.deleteNotification); // Example: Admin deletes a notification

module.exports = router;