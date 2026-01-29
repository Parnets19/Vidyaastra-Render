const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const School = require("../models/School");
const TeacherLogin = require("../models/teacherLoginModel");
const Class = require("../models/Class");
const { uploadFile2 } = require("../config/AWS");

// ---------------- REGISTER TEACHER ----------------
exports.registerTeacher = async (req, res) => {
  try {
    const { schoolId } = req.params;
    let { email, password, name, phone, classSubjects } = req.body;

    // Parse classSubjects if it's a string (from FormData)
    if (typeof classSubjects === "string") {
      try {
        classSubjects = JSON.parse(classSubjects);
      } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid classSubjects format" });
      }
    }

    console.log("Register teacher data:", { name, email, phone, classSubjects });

    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    // Check if email already exists
    const existingTeacher = await TeacherLogin.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Check if phone already exists
    const existingPhone = await TeacherLogin.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: "Phone already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle profile picture upload
    let profilePic = "";
    if (req.file) {
      profilePic = await uploadFile2(req.file, "teachers");
    }

    // Extract classes and subjects from classSubjects
    const classes = classSubjects.map(cs => cs.className);
    const subjects = [...new Set(classSubjects.flatMap(cs => cs.subjects))]; // Unique subjects

    // Create new teacher
    const newTeacher = new TeacherLogin({
      name,
      email,
      phone,
      password: hashedPassword,
      schoolId,
      profilePic,
      classes,
      subjects,
      classSubjects,
    });

    await newTeacher.save();

    res.status(201).json({
      success: true,
      message: "Teacher registered successfully",
      data: {
        _id: newTeacher._id,
        name: newTeacher.name,
        email: newTeacher.email,
        phone: newTeacher.phone,
        subjects: newTeacher.subjects,
        classes: newTeacher.classes,
        classSubjects: newTeacher.classSubjects,
        schoolId: newTeacher.schoolId,
        profilePic: newTeacher.profilePic,
      },
    });
  } catch (error) {
    console.error("Error registering teacher:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------- LOGIN TEACHER ----------------
exports.loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if teacher exists
    const teacher = await TeacherLogin.findOne({ email });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: teacher._id, role: "teacher" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        subjects: teacher.subjects,
        classes: teacher.classes,
        classSubjects: teacher.classSubjects,
        schoolId: teacher.schoolId,
        profilePic: teacher.profilePic,
      },
    });
  } catch (error) {
    console.error("Login teacher error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------- GET ALL TEACHERS BY SCHOOL ----------------
exports.getAllTeachers = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { page = 1, limit = 10, className, section, subject, dateRange } = req.query;

    // Build query
    const query = { schoolId };

    // Filter by className
    if (className) {
      query["classSubjects.className"] = { $regex: className, $options: "i" };
    }

    // Filter by section
    if (section) {
      query["classSubjects.className"] = {
        $regex: `${section}$`,
        $options: "i",
      };
    }

    // Filter by subject
    if (subject) {
      query["classSubjects.subjects"] = { $in: [subject] };
    }

    // Filter by date range
    if (dateRange) {
      const now = new Date();
      let startDate;
      if (dateRange === "today") {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (dateRange === "lastWeek") {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (dateRange === "lastMonth") {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      }
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    // Count total teachers matching the query
    const total = await TeacherLogin.countDocuments(query);

    // Fetch teachers with pagination and filters
    const teachers = await TeacherLogin.find(query)
      .select("-password")
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: teachers.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: teachers,
    });
  } catch (error) {
    console.error("Get all teachers error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------- GET TEACHER BY ID ----------------
exports.getTeacherById = async (req, res) => {
  try {
    const { schoolId, teacherId } = req.params;

    const teacher = await TeacherLogin.findOne({
      _id: teacherId,
      schoolId,
    }).select("-password");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Get teacher by ID error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------- DELETE TEACHER ----------------
exports.deleteTeacher = async (req, res) => {
  try {
    const { schoolId, teacherId } = req.params;

    // Check if teacher exists under this school
    const teacher = await TeacherLogin.findOne({ _id: teacherId, schoolId });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    // Delete teacher
    await TeacherLogin.deleteOne({ _id: teacherId, schoolId });

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
      data: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
      },
    });
  } catch (error) {
    console.error("Delete teacher error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------- UPDATE TEACHER ----------------
exports.updateTeacher = async (req, res) => {
  try {
    const { schoolId, teacherId } = req.params;
    let { name, email, phone, subjects, classes, password, classTeacherOf, classSubjects } = req.body;

    // Parse classSubjects if it's a string (from FormData)
    if (typeof classSubjects === "string") {
      try {
        classSubjects = JSON.parse(classSubjects);
      } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid classSubjects format" });
      }
    }

    // Find teacher under this school
    const teacher = await TeacherLogin.findOne({ _id: teacherId, schoolId });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    // If email is being updated, check if it’s already taken
    if (email && email !== teacher.email) {
      const existingEmail = await TeacherLogin.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }
    }

    // If phone is being updated, check if it’s already taken
    if (phone && phone !== teacher.phone) {
      const existingPhone = await TeacherLogin.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: "Phone already registered" });
      }
    }

    // Handle profile pic update
    let profilePic = teacher.profilePic;
    if (req.file) {
      profilePic = await uploadFile2(req.file, "teachers");
    }

    // If password is provided, hash it
    let hashedPassword = teacher.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Handle classTeacherOf update
    if (classTeacherOf && classTeacherOf !== String(teacher.classTeacherOf)) {
      // Remove teacher from previous class (if any)
      if (teacher.classTeacherOf) {
        await Class.findByIdAndUpdate(teacher.classTeacherOf, {
          classTeacher: null,
        });
      }

      // Assign teacher to new class
      const newClass = await Class.findById(classTeacherOf);
      if (!newClass) {
        return res.status(404).json({ success: false, message: "Class not found" });
      }
      newClass.classTeacher = teacherId;
      await newClass.save();

      teacher.classTeacherOf = classTeacherOf;
    }

    // Update teacher fields
    teacher.name = name || teacher.name;
    teacher.email = email || teacher.email;
    teacher.phone = phone || teacher.phone;
    teacher.subjects = classSubjects ? [...new Set(classSubjects.flatMap(cs => cs.subjects))] : teacher.subjects;
    teacher.classes = classSubjects ? classSubjects.map(cs => cs.className) : teacher.classes;
    teacher.classSubjects = classSubjects || teacher.classSubjects;
    teacher.password = hashedPassword;
    teacher.profilePic = profilePic;

    await teacher.save();

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        subjects: teacher.subjects,
        classes: teacher.classes,
        classSubjects: teacher.classSubjects,
        classTeacherOf: teacher.classTeacherOf,
        schoolId: teacher.schoolId,
        profilePic: teacher.profilePic,
      },
    });
  } catch (error) {
    console.error("Update teacher error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------- GET TEACHER BY ID (All Schools) ----------------
exports.getTeacherByIdGlobal = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate ID format
    if (!teacherId || !teacherId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID format",
      });
    }

    // Find teacher (not restricted to school)
    const teacher = await TeacherLogin.findById(teacherId).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Get teacher by ID (global) error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


exports.getAllTeacherses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Count total teachers
    const total = await TeacherLogin.countDocuments();

    // Fetch teachers with pagination
    const teachers = await TeacherLogin.find({})
      .select("-password")
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!teachers || teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No teachers found",
      });
    }

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: teachers,
    });
  } catch (error) {
    console.error("Get all teachers error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};