const Birthday = require("../models/Birthday")
const Class = require("../models/Class")

// Get all birthdays by schoolId only (UNCHANGED - existing API)
  exports.getAllBirthdays = async (req, res) => {
    try {
      const { schoolId, upcomingPage = 1, pastPage = 1, limit = 10 } = req.query;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: "School ID is required in query parameters.",
        });
      }

      const birthdays = await Birthday.find({ schoolId })
        .populate("classId", "className section")
        .sort({ date: 1 });

      const currentDate = new Date();

      let upcoming = [];
      let past = [];

      // Split birthdays
      birthdays.forEach((birthday) => {
        const bdayDate = new Date(birthday.date);

        // Normalize year for comparison (ignore year)
        const birthdayThisYear = new Date(
          currentDate.getFullYear(),
          bdayDate.getMonth(),
          bdayDate.getDate()
        );

        if (birthdayThisYear >= currentDate) {
          upcoming.push(birthday);
        } else {
          past.push(birthday);
        }
      });

      // Pagination helper
      const paginate = (array, page, limit) => {
        const start = (page - 1) * limit;
        return array.slice(start, start + limit);
      };

      const upcomingPageNum = parseInt(upcomingPage, 10) || 1;
      const pastPageNum = parseInt(pastPage, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      const upcomingPaginated = paginate(upcoming, upcomingPageNum, limitNum);
      const pastPaginated = paginate(past, pastPageNum, limitNum);

      res.status(200).json({
        success: true,
        upcoming: {
          total: upcoming.length,
          page: upcomingPageNum,
          totalPages: Math.ceil(upcoming.length / limitNum),
          data: upcomingPaginated,
        },
        past: {
          total: past.length,
          page: pastPageNum,
          totalPages: Math.ceil(past.length / limitNum),
          data: pastPaginated,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

// NEW: Get birthdays by schoolId and classId (for class-specific birthdays)
exports.getBirthdaysByClass = async (req, res) => {
  try {
    const { schoolId, classId } = req.query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    if (!classId) {
      return res.status(400).json({ success: false, message: "Class ID is required in query parameters." })
    }

    console.log("Getting birthdays for school:", schoolId, "and class:", classId)

    // Verify class exists and belongs to school
    const classExists = await Class.findOne({ _id: classId, schoolId: schoolId })
    if (!classExists) {
      return res.status(404).json({ 
        success: false, 
        message: "Class not found or does not belong to this school" 
      })
    }

    const birthdays = await Birthday.find({ schoolId: schoolId, classId: classId })
      .populate("classId", "className section")
      .sort({ date: 1 })

    console.log(`Found ${birthdays.length} birthdays for class ${classExists.className}`)

    // Separate into upcoming and past based on current date
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentDay = currentDate.getDate()

    const result = {
      upcoming: [],
      past: [],
      classInfo: {
        className: classExists.className,
        section: classExists.section
      }
    }

    birthdays.forEach((birthday) => {
      const [monthStr, dayStr] = birthday.date.split(" ")
      const month = new Date(`${monthStr} 1, 2000`).getMonth() + 1
      const day = Number.parseInt(dayStr, 10)

      if (month > currentMonth || (month === currentMonth && day >= currentDay)) {
        result.upcoming.push(birthday)
      } else {
        result.past.push(birthday)
      }
    })

    res.status(200).json(result)
  } catch (error) {
    console.error("Get birthdays by class error:", error)
    res.status(500).json({ message: error.message })
  }
}

// MODIFIED: Create a new birthday (now requires classId)
exports.createBirthday = async (req, res) => {
  try {
    const { name, role, date, color, type, schoolId, classId } = req.body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    if (!classId) {
      return res.status(400).json({ success: false, message: "Class ID is required." })
    }

    // Verify class exists and belongs to school
    const classExists = await Class.findOne({ _id: classId, schoolId: schoolId })
    if (!classExists) {
      return res.status(404).json({ 
        success: false, 
        message: "Class not found or does not belong to this school" 
      })
    }

    const newBirthday = new Birthday({
      name,
      role,
      date,
      color,
      type,
      schoolId,
      classId, // NEW: Add classId
    })

    const savedBirthday = await newBirthday.save()
    
    // Populate the class info in response
    await savedBirthday.populate("classId", "className section")
    
    console.log("Created birthday for class:", classExists.className)
    
    res.status(201).json({
      success: true,
      data: savedBirthday
    })
  } catch (error) {
    console.error("Create birthday error:", error)
    res.status(400).json({ message: error.message })
  }
}

// MODIFIED: Update a birthday (now handles classId)
exports.updateBirthday = async (req, res) => {
  try {
    const { id } = req.params
    const { name, role, date, color, type, schoolId, classId } = req.body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    // If classId is being updated, verify it exists and belongs to school
    if (classId) {
      const classExists = await Class.findOne({ _id: classId, schoolId: schoolId })
      if (!classExists) {
        return res.status(404).json({ 
          success: false, 
          message: "Class not found or does not belong to this school" 
        })
      }
    }

    const updateData = { name, role, date, color, type }
    if (classId) {
      updateData.classId = classId
    }

    const updatedBirthday = await Birthday.findOneAndUpdate(
      { _id: id, schoolId: schoolId },
      updateData,
      { new: true }
    ).populate("classId", "className section")

    if (!updatedBirthday) {
      return res.status(404).json({ message: "Birthday not found or does not belong to this school" })
    }

    res.status(200).json({
      success: true,
      data: updatedBirthday
    })
  } catch (error) {
    console.error("Update birthday error:", error)
    res.status(400).json({ message: error.message })
  }
}

// Delete a birthday (UNCHANGED)
exports.deleteBirthday = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const deletedBirthday = await Birthday.findOneAndDelete({ _id: id, schoolId: schoolId })

    if (!deletedBirthday) {
      return res.status(404).json({ message: "Birthday not found or does not belong to this school" })
    }

    res.status(200).json({ 
      success: true, 
      message: "Birthday deleted successfully" 
    })
  } catch (error) {
    console.error("Delete birthday error:", error)
    res.status(400).json({ message: error.message })
  }
}

// Get all birthdays unfiltered (UNCHANGED)
// ---------------- GET ALL BIRTHDAYS (with Pagination) ----------------
exports.getAllBirthdaysUnfiltered = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // ✅ Count total birthdays
    const total = await Birthday.countDocuments();

    // ✅ Fetch birthdays with pagination
    const birthdays = await Birthday.find({})
      .populate("classId", "className section")
      .sort({ date: 1 }) // ascending by date
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!birthdays || birthdays.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No birthdays found",
      });
    }

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: birthdays,
    });
  } catch (error) {
    console.error("Get all birthdays error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

