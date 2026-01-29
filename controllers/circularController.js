const Circular = require("../models/circularModel")



// Create Circular
exports.createCircular = async (req, res) => {
  try {
    console.log("Create circular request body:", req.body); // Debug log
    console.log("Create circular request headers:", req.headers); // Debug log
    
    const { schoolId, ...rest } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      console.log("Missing schoolId in request body"); // Debug log
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    console.log("Creating circular with data:", { ...rest, schoolId }); // Debug log
    const newCircular = await Circular.create({ ...rest, schoolId }) // MODIFIED: Add schoolId
    console.log("Circular created successfully:", newCircular); // Debug log
    res.status(201).json({ success: true, data: newCircular })
  } catch (error) {
    console.error("Create circular error:", error); // Debug log
    res.status(400).json({ success: false, message: error.message })
  }
}

// Get All Circulars
exports.getAllCirculars = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10 } = req.query; // default: 1st page, 10 items

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required in query parameters." });
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch circulars with pagination
    const circulars = await Circular.find({ schoolId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Count total documents
    const total = await Circular.countDocuments({ schoolId });

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: circulars,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get Single Circular
exports.getCircularById = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const circular = await Circular.findById({ _id: id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
    if (!circular)
      return res.status(404).json({ success: false, message: "Circular not found or does not belong to this school" })
    res.status(200).json({ success: true, data: circular })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update Circular (including marking as read)
exports.updateCircular = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, ...updateFields } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const updated = await Circular.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      updateFields,
      { new: true },
    )
    if (!updated)
      return res.status(404).json({ success: false, message: "Circular not found or does not belong to this school" })
    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Delete Circular
exports.deleteCircular = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const deleted = await Circular.findByIdAndDelete({ _id: id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId
    if (!deleted)
      return res.status(404).json({ success: false, message: "Circular not found or does not belong to this school" })
    res.status(200).json({ success: true, message: "Deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { schoolId } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    await Circular.updateMany({ schoolId: schoolId }, { read: true }) // MODIFIED: Filter by schoolId
    res.status(200).json({ success: true, message: "All circulars marked as read for this school" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}



// ---------------- GET ALL CIRCULARS (with Optional Filters) ----------------
exports.getAllCircularsUnfiltered = async (req, res) => {
  try {
    const { schoolId, classId, startDate, endDate } = req.query;

    // ✅ Build dynamic filter
    let filter = {};

    if (schoolId) {
      filter.schoolId = schoolId;
    }

    if (classId) {
      filter.classId = classId;
    }

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // ✅ Fetch circulars with filters applied
    const circulars = await Circular.find(filter).sort({ date: -1 });

    if (!circulars || circulars.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No circulars found",
      });
    }

    res.status(200).json({
      success: true,
      count: circulars.length,
      data: circulars,
    });
  } catch (error) {
    console.error("Get all circulars error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


