const Holiday = require("../models/Holiday")

const getAllHolidays = async (req, res) => {
  try {
    const { year, type, search, schoolId, page = 1, limit = 10 } = req.query

    // WARNING: Relying on client-provided schoolId without authentication
    if (!schoolId) {
      return res.status(400).json({ success: false, error: "School ID is required in query parameters." })
    }

    const query = { schoolId: schoolId } // Filter by schoolId

    if (year) {
      query.year = Number.parseInt(year)
    }

    if (type && ["National Holiday", "Festival", "Religious Holiday"].includes(type)) {
      query.type = type
    }

    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    // Pagination setup
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Count total documents
    const total = await Holiday.countDocuments(query);

    // Fetch holidays with pagination
    const holidays = await Holiday.find(query)
      .sort("date")
      .skip(skip)
      .limit(limitNumber);

    res.json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      count: holidays.length,
      data: holidays,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: "Server Error" })
  }
}

const getUpcomingHolidays = async (req, res) => {
  try {
    const { schoolId } = req.query

    // WARNING: Relying on client-provided schoolId without authentication
    if (!schoolId) {
      return res.status(400).json({ success: false, error: "School ID is required in query parameters." })
    }

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()

    const holidays = await Holiday.find({
      year: { $gte: currentYear },
      schoolId: schoolId, // Filter by schoolId
    }).sort("date")

    const upcomingHolidays = holidays
      .filter((holiday) => {
        try {
          const [month, dayWithComma, year] = holiday.date.split(" ")
          const day = dayWithComma.replace(",", "")

          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ]
          const monthIndex = monthNames.indexOf(month)

          if (monthIndex === -1) {
            console.error(`Invalid month name: ${month}`)
            return false
          }

          const holidayDate = new Date(Number.parseInt(year, 10), monthIndex, Number.parseInt(day, 10))

          const today = new Date()
          today.setHours(0, 0, 0, 0)

          return holidayDate >= today
        } catch (error) {
          console.error(`Error parsing date for holiday ${holiday.name}:`, error)
          return false
        }
      })
      .slice(0, 3)

    res.json({
      success: true,
      count: upcomingHolidays.length,
      data: upcomingHolidays,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: "Server Error" })
  }
}

const getHoliday = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query

    // WARNING: Relying on client-provided schoolId without authentication
    if (!schoolId) {
      return res.status(400).json({ success: false, error: "School ID is required in query parameters." })
    }

    const holiday = await Holiday.findOne({ _id: id, schoolId: schoolId }) // Find by ID AND schoolId

    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: "Holiday not found or does not belong to this school",
      })
    }

    res.json({
      success: true,
      data: holiday,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: "Server Error" })
  }
}

const createHoliday = async (req, res) => {
  try {
    const { date, schoolId, ...rest } = req.body // MODIFIED: Get schoolId from req.body

    // WARNING: Relying on client-provided schoolId without authentication
    if (!schoolId) {
      return res.status(400).json({ success: false, error: "School ID is required in request body." })
    }

    // Extract year from date string
    const dateParts = date.split(" ")
    const year = Number.parseInt(dateParts[dateParts.length - 1])

    const holiday = await Holiday.create({ ...rest, date, year, schoolId }) // Add schoolId

    res.status(201).json({
      success: true,
      data: holiday,
    })
  } catch (err) {
    console.error(err)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "This holiday already exists for the given year and school",
      })
    }
    res.status(500).json({ success: false, error: "Server Error" })
  }
}

const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, date, ...updateFields } = req.body // MODIFIED: Get schoolId from req.body

    // WARNING: Relying on client-provided schoolId without authentication
    if (!schoolId) {
      return res.status(400).json({ success: false, error: "School ID is required in request body." })
    }

    // Extract year from date string if date is being updated
    if (date) {
      const dateParts = date.split(" ")
      updateFields.year = Number.parseInt(dateParts[dateParts.length - 1])
    }

    const holiday = await Holiday.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // Find by ID AND schoolId
      { ...updateFields, ...(date && { date }) }, // Include date if it was in the body
      { new: true, runValidators: true },
    )

    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: "Holiday not found or does not belong to this school",
      })
    }

    res.json({
      success: true,
      data: holiday,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: "Server Error" })
  }
}

const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from req.body (or req.query if preferred for DELETE)

    // WARNING: Relying on client-provided schoolId without authentication
    if (!schoolId) {
      return res.status(400).json({ success: false, error: "School ID is required in request body." })
    }

    const holiday = await Holiday.findByIdAndDelete({ _id: id, schoolId: schoolId }) // Find by ID AND schoolId

    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: "Holiday not found or does not belong to this school",
      })
    }

    res.json({
      success: true,
      data: {},
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: "Server Error" })
  }
}



const getAllHolidaysUnfiltered = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // ✅ Count total holidays
    const total = await Holiday.countDocuments();

    // ✅ Fetch holidays with pagination
    const holidays = await Holiday.find({})
      .sort("date") // ascending by date
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!holidays || holidays.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No holidays found",
      });
    }

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: holidays,
    });
  } catch (err) {
    console.error("Get all holidays error:", err.message);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};


module.exports = {
  getAllHolidays,
  getUpcomingHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getAllHolidaysUnfiltered,
}
