const Event = require("../models/Event")


// Create Event
exports.createEvent = async (req, res) => {
  try {
    console.log("Create event request body:", req.body); // Debug log
    console.log("Create event request headers:", req.headers); // Debug log
    
    const { schoolId, ...rest } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      console.log("Missing schoolId in request body"); // Debug log
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    console.log("Creating event with data:", { ...rest, schoolId }); // Debug log
    const event = new Event({ ...rest, schoolId }) // MODIFIED: Add schoolId
    await event.save()
    console.log("Event created successfully:", event); // Debug log
    res.status(201).json(event)
  } catch (err) {
    console.error("Create event error:", err); // Debug log
    res.status(400).json({ error: err.message })
  }
}

// Get All Events
exports.getAllEvents = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10 } = req.query; // default: 1st page, 10 per page

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch events with pagination
    const events = await Event.find({ schoolId })
      .sort({ date: 1 }) // ascending by date
      .skip(skip)
      .limit(limitNumber);

    // Count total docs for pagination
    const total = await Event.countDocuments({ schoolId });

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: events,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching events",
      error: err.message,
    });
  }
};


// Get Single Event by ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const event = await Event.findById({ _id: id, schoolId: schoolId }) // MODIFIED: Find by ID AND schoolId
    if (!event) return res.status(404).json({ message: "Event not found or does not belong to this school" })
    res.json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, ...updateFields } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const updated = await Event.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      updateFields,
      { new: true },
    )
    if (!updated) return res.status(404).json({ message: "Event not found or does not belong to this school" })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const deleted = await Event.findByIdAndDelete({ _id: id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId
    if (!deleted) return res.status(404).json({ message: "Event not found or does not belong to this school" })
    res.json({ message: "Event deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// NEW: Get All Events (Global - without school filter)
// ---------------- GET ALL EVENTS (Global with Pagination) ----------------
exports.getAllEventsGlobal = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // ✅ Count total documents
    const total = await Event.countDocuments();

    // ✅ Fetch events with pagination
    const events = await Event.find({})
      .populate("schoolId", "name") // Optional: populate school name if needed
      .sort({ date: 1 }) // oldest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No events found",
      });
    }

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: events,
    });
  } catch (err) {
    console.error("Get all events error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

