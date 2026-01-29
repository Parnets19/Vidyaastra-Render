const express = require("express");
const router = express.Router();

const {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
} = require("../controllers/EnquiryController");

// Middleware imports (uncomment and modify based on your auth setup)
// const { protect, admin } = require('../middleware/auth');
// const { validateEnquiry } = require('../middleware/validation');

// Validation middleware for enquiry creation
const validateEnquiry = (req, res, next) => {
  const { name, school, email, phone, message } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters");
  }
  if (!school || school.trim().length < 2) {
    errors.push("School name is required and must be at least 2 characters");
  }
  if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push("Valid email is required");
  }
  if (!phone || !/^[\+]?[1-9][\d]{0,15}$/.test(phone)) {
    errors.push("Valid phone number is required");
  }
  if (!message || message.trim().length < 10) {
    errors.push("Message is required and must be at least 10 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Rate limiting middleware (optional)
const rateLimit = require("express-rate-limit");
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: "Too many enquiry submissions, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post("/", validateEnquiry, createEnquiry);

// Protected routes (Admin only)
// Note: Uncomment and modify the middleware below based on your authentication setup
router.get("/", /* protect, admin, */ getAllEnquiries);
router.get("/stats/dashboard", /* protect, admin, */ getEnquiryStats);
router.get("/:id", /* protect, admin, */ getEnquiryById);
router.put("/:id", /* protect, admin, */ updateEnquiry);
router.delete("/:id", /* protect, admin, */ deleteEnquiry);

module.exports = router;
