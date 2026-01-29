const Classwork = require("../models/Classwork")
const path = require("path")
const fs = require("fs")
const Class = require("../models/Class");
const { uploadFile2 } = require("../config/AWS");

// Helper function to process attachments and save files permanently
const processAttachments = async (files, schoolId) => {
  if (!files || files.length === 0) {
    console.log("No files to process");
    return [];
  }

  try {
    // Process all files in parallel using Promise.all
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        // Upload file to permanent storage
        const normalizedPath = await uploadFile2(file, `classwork/${schoolId}`);

        console.log(`File uploaded: ${file.originalname}`);
        console.log(`Stored at: ${normalizedPath}`);

        return {
          name: file.originalname,
          url: `${normalizedPath}`, // final accessible URL
        };
      })
    );

    return uploadedFiles;
  } catch (error) {
    console.error("Error processing attachments:", error);
    throw error;
  }
};


// Get all classwork entries
exports.getAllClasswork = async (req, res) => {
try {
  // MODIFIED: Get classId from query parameters
  const { schoolId, classId } = req.query

  if (!schoolId || !classId) {
    return res.status(400).json({ success: false, message: "School ID and Class ID are required in query parameters." })
  }

  // MODIFIED: Filter by classId as well
  const classwork = await Classwork.find({ schoolId: schoolId, classId: classId }).sort({ date: -1 })
  res.status(200).json(classwork)
} catch (error) {
  res.status(500).json({ message: error.message })
}
}

// Create new classwork with attachments
exports.createClasswork = async (req, res) => {
try {
  console.log("Request body:", req.body)
  console.log("Request files:", req.files)

  // MODIFIED: Get classId from body
  const { subject, date, topic, description, schoolId, classId } = req.body

  if (!schoolId || !classId) { // MODIFIED: classId is now required
    return res.status(400).json({ success: false, message: "School ID and Class ID are required." })
  }

  // FIX: Use req.files directly, not req.files.attachments
  const attachments =await processAttachments(req.files, schoolId)
  console.log("Processed attachments:", attachments)

  const newClasswork = new Classwork({
    subject,
    date: date || new Date(),
    topic,
    description,
    attachments,
    schoolId,
    classId, // NEW: Save classId
  })

  const savedClasswork = await newClasswork.save()
  res.status(201).json(savedClasswork)
} catch (error) {
  console.error("Error creating classwork:", error)
  
  // Clean up any uploaded files if error occurs

  res.status(400).json({ message: error.message })
}
}

// Update classwork with optional new attachments
exports.updateClasswork = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, date, topic, description, schoolId, classId } = req.body;

    const updateData = { subject, date, topic, description };

    // Process new attachments if any
    if (req.files && req.files.length > 0) {
      // ✅ FIX: Await the async processAttachments function
      const newAttachments = await processAttachments(req.files, schoolId);

      console.log("Processed attachments:", newAttachments);

      if (Array.isArray(newAttachments) && newAttachments.length > 0) {
        updateData.$push = {
          attachments: { $each: newAttachments }
        };
      }
    }

    const updatedClasswork = await Classwork.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }
    );

    if (!updatedClasswork) {
      return res.status(404).json({
        message: "Classwork not found or does not belong to this school/class",
      });
    }

    res.status(200).json(updatedClasswork);
  } catch (error) {
    console.error("Error updating classwork:", error);
    res.status(400).json({ message: error.message });
  }
};


// Delete classwork and its attachments
exports.deleteClasswork = async (req, res) => {
try {
  const { id } = req.params
  // MODIFIED: Get classId from body
  // const { schoolId, classId } = req.body

  // if (!schoolId || !classId) { // MODIFIED: classId is now required for scoping
  //   return res.status(400).json({ success: false, message: "School ID and Class ID are required." })
  // }

  // MODIFIED: Filter by classId as well
  const classwork = await Classwork.findOneAndDelete({ _id: id})

  if (!classwork) {
    return res.status(404).json({ message: "Classwork not found or does not belong to this school/class" })
  }




  res.status(200).json({ message: "Classwork deleted successfully" })
} catch (error) {
  res.status(400).json({ message: error.message })
}
}

// Delete specific attachment
exports.deleteAttachment = async (req, res) => {
try {
  const { id, attachmentId } = req.params
  // MODIFIED: Get classId from body
  // const { schoolId, classId } = req.body

  // if (!schoolId || !classId) { // MODIFIED: classId is now required for scoping
  //   return res.status(400).json({ success: false, message: "School ID and Class ID are required." })
  // }

  // MODIFIED: Filter by classId as well
  const classwork = await Classwork.findOne({ _id: id, schoolId: schoolId, classId: classId })
  if (!classwork) {
    return res.status(404).json({ message: "Classwork not found or does not belong to this school/class" })
  }

  const attachment = classwork.attachments.id(attachmentId)
  if (!attachment) {
    return res.status(404).json({ message: "Attachment not found" })
  }


  // Remove the attachment reference
  classwork.attachments.pull(attachmentId)
  await classwork.save()

  res.status(200).json({ message: "Attachment deleted successfully" })
} catch (error) {
  res.status(400).json({ message: error.message })
}
}



exports.getAllClassworkBySchoolId = async (req, res) => {
  try {
    let { schoolId, page = 1, limit = 10, classId, date } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    // Convert to integers safely
    const pageNum = Math.max(parseInt(page, 10) || 1, 1); // fallback to 1
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1); // fallback to 10
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { schoolId };
    if (classId) query.classId = classId;

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Fetch data + count
    const [classwork, total] = await Promise.all([
      Classwork.find(query)
        .populate("classId", "className section") // pick only needed fields
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Classwork.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Classwork fetched successfully",
      classwork,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Get all classwork error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




exports.getAllClassworkUnfiltered = async (req, res) => {
try {
  // This endpoint remains unfiltered by classId, as per its name.
  const classwork = await Classwork.find({}).sort({ date: -1 })
  res.status(200).json(classwork)
} catch (error) {
  res.status(500).json({ message: error.message })
}
}


// Get classwork by multiple class names
exports.getClassworkByClassNames = async (req, res) => {
  try {
    let { schoolId, classNames, page = 1, limit = 10, date } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    if (!classNames) {
      return res.status(400).json({
        success: false,
        message: "At least one class name is required in query parameters.",
      });
    }

    // Convert to array (support comma-separated string)
    const classNameArray = Array.isArray(classNames)
      ? classNames
      : classNames.split(",").map((c) => c.trim());

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    // Find classIds for the given classNames
    const classes = await Class.find({
      schoolId,
      className: { $in: classNameArray },
    }).select("_id");

    const classIds = classes.map((cls) => cls._id);

    if (classIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No classes found for given names",
        classwork: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      });
    }

    // Build query
    const query = { schoolId, classId: { $in: classIds } };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Fetch data + count
    const [classwork, total] = await Promise.all([
      Classwork.find(query)
        .populate("classId", "className section")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Classwork.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Classwork fetched successfully",
      classwork,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Get classwork by class names error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};