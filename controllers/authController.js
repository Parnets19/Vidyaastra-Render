const Otp = require('../models/Otp');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const School = require('../models/School');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate 6-digit OTP (existing, for general OTP flow)
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT Token (modified to handle student role)
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role }, // Payload
    process.env.JWT_SECRET, // Secret key
    { expiresIn: process.env.JWT_EXPIRE || "30d" }, // Expiration
  );
};

// Step 1: Request OTP (existing, for general OTP login)
exports.requestOtp = async (req, res) => {
  const { phone, schoolId } = req.body;

  try {
    const student = await Student.findOne({ phone, schoolId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not registered for this school" });
    }

    const otp = generateOtp();

    await Otp.create({ phone, otp });

    res.status(200).json({ success: true, message: "OTP sent", otp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Step 2: Verify OTP and Login (existing, for general OTP login)
exports.verifyOtp = async (req, res) => {
  const { phone, otp, schoolId } = req.body;

  try {
    const validOtp = await Otp.findOne({ phone, otp });

    if (!validOtp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const student = await Student.findOne({ phone, schoolId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found for this school" });
    }

    await Otp.deleteMany({ phone });

    // Generate token for student after OTP login
    const token = generateToken(student._id, "student");

    res.status(200).json({ success: true, message: "Login successful", token, student: { id: student._id, name: student.name, email: student.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new teacher (existing)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, email, password, phone, subject, school } = req.body;
  if (!name || !email || !password || !phone || !subject || !school) {
    return res.status(400).json({
      success: false,
      message: 'Please enter all fields'
    });
  }
  try {
    const teacherExists = await Teacher.findOne({ email });
    if (teacherExists) {
      return res.status(400).json({
        success: false,
        message: 'Teacher already exists with this email'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const teacher = await Teacher.create({
      name,
      email,
      password: hashedPassword,
      phone,
      subject,
      school
    });

    const token = generateToken(teacher._id, "teacher");

    res.status(201).json({
      success: true,
      token,
      data: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        profilePic: teacher.profilePic
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login teacher (existing)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ email }).select('+password');
    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(teacher._id, "teacher");

    res.status(200).json({
      success: true,
      token,
      data: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        profilePic: teacher.profilePic
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current logged-in teacher (existing)
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id).select('-password');

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Middleware to protect teacher routes (existing)
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "teacher") { // Ensure it's a teacher token
      return res.status(403).json({ success: false, message: "Access denied, not a teacher token" });
    }

    req.teacher = await Teacher.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// --- NEW STUDENT AUTHENTICATION FUNCTIONS ---

// @desc    Register a new student with password and dummy OTP
// @route   POST /api/auth/student/register
exports.studentRegister = async (req, res) => {
  const {
    name,
    phone,
    email,
    password,
    schoolId,
    otp,
    classId,
    rollNumber,
    studentId: studentUniqueId, // Renamed to avoid conflict with _id
    dob,
    gender,
    address,
    fatherName,
    motherName,
    parentPhone
  } = req.body;

  // Basic validation for all required fields in Student model
  if (!name || !phone || !email || !password || !schoolId || !otp ||
      !classId || !rollNumber || !studentUniqueId || !dob || !gender ||
      !address || !fatherName || !motherName || !parentPhone) {
    return res.status(400).json({ success: false, message: 'Please provide all required student details for registration' });
  }

  try {
    // Check for existing student with same phone or email in the same school
    const studentExists = await Student.findOne({
      $or: [{ phone, schoolId }, { email, schoolId }]
    });

    if (studentExists) {
      return res.status(400).json({ success: false, message: 'Student with this phone or email already exists for this school' });
    }

    // Verify dummy OTP for registration
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP for registration' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create student record with all required fields
    const student = await Student.create({
      name,
      classId,
      rollNumber,
      studentId: studentUniqueId,
      dob,
      gender,
      address,
      phone,
      email,
      password: hashedPassword,
      fatherName,
      motherName,
      parentPhone,
      schoolId
    });

    const token = generateToken(student._id, "student");

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        schoolId: student.schoolId,
        classId: student.classId // ADDED: classId to the response
      }
    });
  } catch (error) {
    console.error("Student registration error:", error);
    res.status(500).json({ success: false, message: 'Server error during student registration', error: error.message });
  }
};

// @desc    Login student with password
// @route   POST /api/auth/student/login
exports.studentLogin = async (req, res) => {
  const { phone, password, schoolId } = req.body;

  console.log("--- Student Login Attempt ---");
  console.log("Received body:", req.body);

  if (!phone || !password || !schoolId) {
    console.log("Missing required fields.");
    return res.status(400).json({ success: false, message: 'Please provide phone, password, and school ID' });
  }

  try {
    // Find student by phone and schoolId, and explicitly select password
    const student = await Student.findOne({ phone, schoolId }).select('+password');

    console.log("Found student:", student ? student.email : "No student found");

    if (!student) {
      console.log("Student not found for phone/schoolId combination.");
      return res.status(401).json({ success: false, message: 'Invalid credentials or student not found for this school' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, student.password);

    console.log("Password match result:", isMatch);

    if (!isMatch) {
      console.log("Password does not match.");
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(student._id, "student");

    console.log("Login successful. Token generated.");
    res.status(200).json({
      success: true,
      message: 'Student login successful',
      token,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        schoolId: student.schoolId,
        classId: student.classId,
        profileImage: student.profileImage // ADDED: profileImage to the response
      }
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({ success: false, message: 'Server error during student login', error: error.message });
  } finally {
    console.log("--- End Student Login Attempt ---");
  }
};

// @desc    Change student password
// @route   PUT /api/auth/student/change-password
exports.changeStudentPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const studentId = req.student.id; // Get student ID from authenticated request (set by protectStudent middleware)

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide old and new passwords' });
  }

  try {
    const student = await Student.findById(studentId).select('+password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Old password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(newPassword, salt);
    await student.save(); // Save the updated password

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: 'Server error during password change', error: error.message });
  }
};

// @desc    Middleware to protect student routes
exports.protectStudent = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "student") { // Ensure it's a student token
      return res.status(403).json({ success: false, message: "Access denied, not a student token" });
    }

    req.student = await Student.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};
