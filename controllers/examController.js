const Exam = require("../models/Exam");


// ==================== Create Exam ====================
exports.createExam = async (req, res) => {
  try {
    const { schoolId, classId, examType, subjects, status = "Scheduled" } = req.body;

    // Validation
    if (!schoolId || !classId || !examType) {
      return res.status(400).json({
        success: false,
        message: "School ID, Class ID, and Exam Type are required.",
      });
    }

    // Validate subjects array
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Subjects array with at least one subject is required.",
      });
    }

    // Validate each subject
    for (const subject of subjects) {
      if (
        !subject.subjectName ||
        !subject.date ||
        !subject.startTime ||
        !subject.endTime ||
        !subject.syllabus
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each subject must have subjectName, date, startTime, endTime, and syllabus.",
        });
      }
    }

    // Check if exam with same type already exists for this class
    const existingExam = await Exam.findOne({ schoolId, classId, examType });
    if (existingExam) {
      return res.status(409).json({
        success: false,
        message: `An exam of type '${examType}' already exists for this class.`,
      });
    }

    const exam = new Exam({ schoolId, classId, examType, subjects, status });
    await exam.save();

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      // MongoDB duplicate key error
      return res.status(409).json({
        success: false,
        message: "An exam of this type already exists for this class.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating exam",
      error: err.message,
    });
  }
};


  exports.updateExam = async (req, res) => {
    try {
      const { id } = req.params;
      const { schoolId, subjects, ...updateFields } = req.body;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: "School ID is required.",
        });
      }

      // If updating subjects, validate them
      if (subjects) {
        if (!Array.isArray(subjects) || subjects.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Subjects must be a non-empty array.",
          });
        }

        for (const subject of subjects) {
          if (!subject.subjectName || !subject.date || !subject.startTime || !subject.endTime || !subject.syllabus) {
            return res.status(400).json({
              success: false,
              message: "Each subject must have subjectName, date, startTime, endTime, and syllabus.",
            });
          }
        }
        updateFields.subjects = subjects;
      }

      const exam = await Exam.findOneAndUpdate(
        { _id: id, schoolId },
        updateFields,
        { new: true, runValidators: true }
      );

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found or does not belong to this school",
        });
      }

      res.status(200).json({
        success: true,
        message: "Exam updated successfully",
        data: exam,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Cannot update - an exam of this type already exists for this class.",
        });
      }
      res.status(500).json({
        success: false,
        message: "Error updating exam",
        error: err.message,
      });
    }
  };  
// ==================== Get All Exams ====================
exports.getAllExams = async (req, res) => {
  try {
    const { classId, schoolId, page = 1, limit = 10 } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const query = { schoolId };
    if (classId) query.classId = classId;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const exams = await Exam.find(query)
      .populate("classId")
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    const total = await Exam.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: exams,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching exams",
      error: err.message,
    });
  }
};

// ==================== Get Exam by ID ====================
exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const exam = await Exam.findOne({ _id: id, schoolId }).populate("classId");
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or does not belong to this school",
      });
    }

    res.status(200).json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching exam",
      error: err.message,
    });
  }
};



// ==================== Delete Exam ====================
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required.",
      });
    }

    const exam = await Exam.findOneAndDelete({ _id: id, schoolId });
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or does not belong to this school",
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting exam",
      error: err.message,
    });
  }
};

// ==================== Get All Exams (Unfiltered) ====================
exports.getAllExamsUnfiltered = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const total = await Exam.countDocuments();

    const exams = await Exam.find({})
      .populate("classId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: exams,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching exams",
      error: err.message,
    });
  }
};
