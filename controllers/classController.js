const Class = require("../models/Class");

// ✅ Create Class
exports.createClass = async (req, res) => {
  try {
    const { className, students, section, schoolId ,classTeacher } = req.body;
     console.log(req.body);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." });
    }

    const newClass = new Class({
      className,
      students: students || [], // array of student ObjectIds
      section,
      classTeacher: classTeacher || null, 
      schoolId,
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    console.error("Create Class Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Classes (Paginated + Populate Students & Class Teacher)
exports.getClasses = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10 } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const classes = await Class.find({ schoolId })
      .populate("students", "name rollNo") // only show needed fields
      .populate("classTeacher", "name email phone")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Class.countDocuments({ schoolId });

    res.status(200).json({
      success: true,
      count: classes.length,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: classes,
    });
  } catch (error) {
    console.error("Get Classes Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Class (Populate Students & Class Teacher)
exports.getClassById = async (req, res) => {
  try {
    const { id, schoolId } = req.params; // both from params

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in parameters.",
      });
    }

    const classData = await Class.findOne({ _id: id, schoolId })
      .populate("students", "name rollNo")
      .populate("classTeacher", "name email phone");

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or does not belong to this school",
      });
    }

    res.status(200).json({ success: true, data: classData });
  } catch (error) {
    console.error("Get Class by ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Update Class
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { className, students, section, schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." });
    }

    const updatedClass = await Class.findOneAndUpdate(
      { _id: id, schoolId },
      { className, students, section },
      { new: true, runValidators: true }
    )
      .populate("students", "name rollNo")
      .populate("classTeacher", "name email phone");

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found or does not belong to this school",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass,
    });
  } catch (error) {
    console.error("Update Class Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Class
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." });
    }

    const deletedClass = await Class.findOneAndDelete({ _id: id, schoolId });

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found or does not belong to this school",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Delete Class Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Classes (Unfiltered - useful for super admin/debug)
exports.getAllClassesUnfiltered = async (req, res) => {
  try {
    const classes = await Class.find({})
      .populate("students", "name rollNo")
      .populate("classTeacher", "name email phone");

    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    console.error("Get All Classes Unfiltered Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Get Single Class by ID (only classId)
exports.getClassByclassId = async (req, res) => {
  try {
    const { id } = req.params; // only classId

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required in parameters.",
      });
    }

    const classData = await Class.findById(id)
      .populate("students", "name rollNo")
      .populate("classTeacher", "name email phone");

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({ success: true, data: classData });
  } catch (error) {
    console.error("Get Class by ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

