const TimeTable = require("../models/TimeTable");

// ------------------ ADD TIMETABLE ------------------
exports.addTimetable = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { className, timetableName, day, periods } = req.body;
    console.log(schoolId, "schoolId");
    // Find or create timetable doc for this school
    let timetableDoc = await TimeTable.findOne({ schoolId });

    if (!timetableDoc) {
      timetableDoc = new TimeTable({
        schoolId,
        timetable: [{ className, timetableName, day, periods }],
      });
    } else {
      // push new timetable entry (allow multiple per class/day)
      timetableDoc.timetable.push({ className, timetableName, day, periods });
    }

    await timetableDoc.save();

    res.status(201).json({
      success: true,
      message: "Timetable added successfully",
      data: timetableDoc,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: "Error adding timetable",
      error: error.message,
    });
  }
};

// ------------------ GET ALL TIMETABLES ------------------
// exports.getAllTimetables = async (req, res) => {
//   try {
//     const { schoolId } = req.params;
//     const timetables = await TimeTable.findOne({ schoolId });

//     if (!timetables) {
//       return res.status(404).json({
//         success: false,
//         message: "No timetables found for this school",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: timetables,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching timetables",
//       error: error.message,
//     });
//   }
// };

// ------------------ GET SINGLE TIMETABLE ------------------
exports.getSingleTimetable = async (req, res) => {
  try {
    const { schoolId, timetableId } = req.params;
    const timetableDoc = await TimeTable.findOne({ schoolId });

    if (!timetableDoc) {
      return res.status(404).json({
        success: false,
        message: "No timetables found",
      });
    }

    const timetable = timetableDoc.timetable.id(timetableId);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching timetable",
      error: error.message,
    });
  }
};

// ------------------ UPDATE TIMETABLE ------------------
exports.updateTimetable = async (req, res) => {
  try {
    const { schoolId, timetableId } = req.params;
    const { className, timetableName, day, periods } = req.body;

    const timetableDoc = await TimeTable.findOne({ schoolId });
    if (!timetableDoc) {
      return res.status(404).json({
        success: false,
        message: "No timetables found",
      });
    }

    const timetable = timetableDoc.timetable.id(timetableId);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    if (className) timetable.className = className;
    if (timetableName) timetable.timetableName = timetableName;
    if (day) timetable.day = day;
    if (periods) timetable.periods = periods;

    await timetableDoc.save();

    res.status(200).json({
      success: true,
      message: "Timetable updated successfully",
      data: timetable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating timetable",
      error: error.message,
    });
  }
};

// ------------------ DELETE TIMETABLE ------------------
exports.deleteTimetable = async (req, res) => {
  try {
    const { schoolId, timetableId } = req.params;

    // Validate input parameters
    if (!schoolId || !timetableId) {
      return res.status(400).json({
        success: false,
        message: "School ID and Timetable ID are required",
      });
    }

    // Find the timetable document and update by pulling the specific timetable
    const result = await TimeTable.findOneAndUpdate(
      { schoolId },
      { $pull: { timetable: { _id: timetableId } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No timetables found for this school",
      });
    }

    // Check if the specific timetable was actually removed
    const wasTimetableRemoved = result.timetable.some(t => t._id.toString() === timetableId);
    if (wasTimetableRemoved) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting timetable",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};


// ------------------ GET ALL SCHOOLS TIMETABLES (with Pagination + Optional School Filter) ------------------
exports.getAllTimetables = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
      const { schoolId } = req.params; // Optional schoolId filter
    // Build filter condition
    let filter = {};
    if (schoolId) {
      filter.schoolId = schoolId; // filter by selected school
    }

    // Count total documents
    const total = await TimeTable.countDocuments(filter);

    // Fetch timetables with pagination
    const timetables = await TimeTable.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // if (!timetables || timetables.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No timetables found",
    //   });
    // }

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: timetables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching timetables",
      error: error.message,
    });
  }
};
