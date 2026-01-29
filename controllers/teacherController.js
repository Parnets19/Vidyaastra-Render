const Teacher = require("../models/Teacher");

// Get all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10 } = req.query; // MODIFIED: Added pagination

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    // Convert page & limit to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    // Get total teacher count
    const totalTeachers = await Teacher.countDocuments({ schoolId });

    // Fetch teachers with pagination
    const teachers = await Teacher.find({ schoolId })
      .select("name subject email phone profilePic")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    res.status(200).json({
      success: true,
      count: teachers.length,
      totalTeachers,
      totalPages: Math.ceil(totalTeachers / limitNumber),
      currentPage: pageNumber,
      data: teachers,
    });
  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get single teacher details
exports.getTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query; // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const teacher = await Teacher.findOne({ _id: id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
      .select("-__v")
      .lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or does not belong to this school",
      });
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Create teacher
exports.createTeacher = async (req, res) => {
  try {
    const { schoolId, ...rest } = req.body; // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const teacher = await Teacher.create({ ...rest, schoolId }); // MODIFIED: Add schoolId

    res.status(201).json({
      success: true,
      data: teacher,
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Teacher with this email already exists for this school",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId, ...updateFields } = req.body; // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const teacher = await Teacher.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      updateFields,
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or does not belong to this school",
      });
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Teacher with this email already exists for this school",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body; // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const teacher = await Teacher.findByIdAndDelete({
      _id: id,
      schoolId: schoolId,
    }); // MODIFIED: Delete by ID AND schoolId

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or does not belong to this school",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getAllTeachersUnfiltered = async (req, res) => {
  try {
    const teachers = await Teacher.find({});

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
