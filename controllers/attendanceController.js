const Attendance = require("../models/attendanceModel");

// Create Attendance
exports.createAttendance = async (req, res) => {
  try {
    const { schoolId, ...rest } = req.body; // MODIFIED: Get schoolId from req.body

    // console.log("Creating attendance with data:", req.body);
    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const newAttendance = await Attendance.create({ ...rest, schoolId }); // MODIFIED: Add schoolId
    res.status(201).json({ success: true, data: newAttendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Attendance Records
exports.getAllAttendance = async (req, res) => {
  try {
    const { schoolId, date, page = 1, limit = 10 } = req.query; // Added date parameter

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    // Build query object
    const query = { schoolId };
    
    // Add date filter if provided
    if (date) {
      // Convert date string to Date object for proper comparison
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
      
      query.date = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    }

    // Convert to number for MongoDB skip/limit
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch data with pagination
    const attendance = await Attendance.find(query)
      .populate("studentId")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }); // Sort latest first

    // Count total docs for pagination info
    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: attendance,
    });
  } catch (err) {
    console.error("Get all attendance error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Attendance by Student ID
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { schoolId } = req.query; // MODIFIED: Get schoolId from req.query

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const attendance = await Attendance.find({
      studentId: studentId,
      schoolId: schoolId,
    }).populate("studentId"); // MODIFIED: Filter by studentId AND schoolId
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};


// Update Attendance
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId, ...updateFields } = req.body; // MODIFIED: Get schoolId from req.body

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const updated = await Attendance.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      updateFields,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message:
          "Attendance record not found or does not belong to this school.",
      });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body; // MODIFIED: Get schoolId from req.body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const deleted = await Attendance.findByIdAndDelete({
      _id: id,
      schoolId: schoolId,
    }); // MODIFIED: Delete by ID AND schoolId

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message:
          "Attendance record not found or does not belong to this school.",
      });
    }

    res.status(200).json({ success: true, message: "Attendance deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Attendance by Date - NEW ENDPOINT
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { schoolId, date } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required in query parameters.",
      });
    }

    // Convert date string to Date object for proper comparison
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    console.log(`Fetching attendance for school: ${schoolId}, date: ${date}`);
    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Fetch all attendance records for the specific date (no pagination for this endpoint)
    const attendance = await Attendance.find({
      schoolId: schoolId,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).populate("studentId") .sort({ createdAt: -1 });

    console.log(`Found ${attendance.length} attendance records for date ${date}`);

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (err) {
    console.error("Get attendance by date error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllAttendanceUnfiltered = async (req, res) => {
  try {
    // Get page & limit from query params (default page=1, limit=10)
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    const { schoolId } = req.query; // Add schoolId filter support

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    // Build query object
    const query = {};
    if (schoolId) {
      query.schoolId = schoolId;
    }

    // Get total documents count
    const totalRecords = await Attendance.countDocuments(query);

    // Fetch only paginated data with proper population
    const attendance = await Attendance.find(query)
      .populate({
        path: "studentId",
        select: "name rollNumber studentId className section schoolId"
      })
      .populate({
        path: "schoolId",
      
      }).sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (err) {
    console.error("Get all attendance unfiltered error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

