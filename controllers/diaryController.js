const Diary = require("../models/diaryModel")



// Create diary
exports.createDiary = async (req, res) => {
  try {
    const { student, title, content, category, date, schoolId } = req.body // MODIFIED: Get schoolId from body
    if (!student || !title || !content || !schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields (student, title, content, schoolId)" })
    }

    const newDiary = await Diary.create({ student, title, content, category, date, schoolId }) // MODIFIED: Add schoolId
    res.status(201).json({ success: true, data: newDiary })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Get all diaries (or diaries by studentId if provided)
exports.getAllDiaries = async (req, res) => {
  try {
    const { studentId, schoolId } = req.query // MODIFIED: Get schoolId from query
    const query = {}

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }
    query.schoolId = schoolId // MODIFIED: Filter by schoolId

    if (studentId) {
      query.student = studentId // Filter by student ID if provided
    }

    const diaries = await Diary.find(query).populate("student")
    res.status(200).json({ success: true, data: diaries })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Get single diary by ID
exports.getDiaryById = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.query // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required in query parameters." })
    }

    const diary = await Diary.findById({ _id: id, schoolId: schoolId }).populate("student") // MODIFIED: Find by ID AND schoolId
    if (!diary) {
      return res.status(404).json({ success: false, message: "Diary not found or does not belong to this school" })
    }
    res.status(200).json({ success: true, data: diary })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Update diary
exports.updateDiary = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, ...updateFields } = req.body // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const updated = await Diary.findByIdAndUpdate(
      { _id: id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      updateFields,
      { new: true },
    )
    if (!updated) {
      return res.status(404).json({ success: false, message: "Diary not found or does not belong to this school" })
    }
    res.status(200).json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Delete diary
exports.deleteDiary = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const deleted = await Diary.findByIdAndDelete({ _id: id, schoolId: schoolId }) // MODIFIED: Delete by ID AND schoolId
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Diary not found or does not belong to this school" })
    }
    res.status(200).json({ success: true, message: "Diary deleted" })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}


exports.getAllDiariesUnfiltered = async (req, res) => {
  try {
    const diaries = await Diary.find({}).populate("student")
    res.status(200).json({ success: true, data: diaries })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}